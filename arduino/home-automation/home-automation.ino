#include <ESP32Servo.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <DHT.h>

// ================== WiFi ==================
const char* ssid = "your wifi name";          // ✅ your new hotspot name
const char* password = "your password";   // ✅ your hotspot password

// ============== Pin definitions ===========
#define DHTPIN 4
#define DHTTYPE DHT11

#define RELAY_LIGHT 23
#define RELAY_FAN   22
#define SERVO_PIN   21
#define PIR_PIN     27

// ✅ RELAYS ARE ACTIVE LOW
const bool RELAY_ACTIVE_HIGH = false;
#define RELAY_ON  (RELAY_ACTIVE_HIGH ? HIGH : LOW)
#define RELAY_OFF (RELAY_ACTIVE_HIGH ? LOW  : HIGH)

// ============== Objects ==================
DHT dht(DHTPIN, DHTTYPE);
Servo doorServo;
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// ============== States ====================
bool lightState = false;
bool fanState   = false;
bool doorOpen   = false;
bool motion     = false;

unsigned long lastMotionMs = 0;
const unsigned long MOTION_HOLD_MS = 4000;

// ============ PIR ISR =====================
void IRAM_ATTR pirISR() {
  motion = true;
  lastMotionMs = millis();
}

// ============ Helpers =====================
void applyRelayStates() {
  digitalWrite(RELAY_LIGHT, lightState ? RELAY_ON : RELAY_OFF);
  digitalWrite(RELAY_FAN,   fanState   ? RELAY_ON : RELAY_OFF);
}

String statusJSON() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  String json = "{";
  json += "\"light\":" + String(lightState ? "true" : "false") + ",";
  json += "\"fan\":"   + String(fanState   ? "true" : "false") + ",";
  json += "\"door\":"  + String(doorOpen   ? "true" : "false") + ",";
  json += "\"motion\":" + String(motion ? "true" : "false") + ",";

  if (isnan(t) || isnan(h)) {
    json += "\"temp\":null,\"hum\":null";
  } else {
    json += "\"temp\":" + String(t,1) + ",\"hum\":" + String(h,1);
  }
  json += "}";
  return json;
}

// ================ Setup ===================
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_LIGHT, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(PIR_PIN, INPUT);

  lightState = false;
  fanState   = false;
  applyRelayStates();

  dht.begin();
  doorServo.attach(SERVO_PIN);
  doorServo.write(0);
  doorOpen = false;

  attachInterrupt(digitalPinToInterrupt(PIR_PIN), pirISR, RISING);

  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { Serial.print("."); delay(500); }

  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP());

  // WebSocket
  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
                AwsEventType type, void *arg, uint8_t *data, size_t len)
  {
    if (type == WS_EVT_CONNECT) {
      client->text(statusJSON());
    }
  });
  server.addHandler(&ws);

  // ===== REST ENDPOINTS =====
  server.on("/light/on", HTTP_GET, [](AsyncWebServerRequest *req){
    lightState = true; applyRelayStates();
    req->send(200,"text/plain","OK");
    ws.textAll(statusJSON());
  });

  server.on("/light/off", HTTP_GET, [](AsyncWebServerRequest *req){
    lightState = false; applyRelayStates();
    req->send(200,"text/plain","OK");
    ws.textAll(statusJSON());
  });

  server.on("/fan/on", HTTP_GET, [](AsyncWebServerRequest *req){
    fanState = true; applyRelayStates();
    req->send(200,"text/plain","OK");
    ws.textAll(statusJSON());
  });

  server.on("/fan/off", HTTP_GET, [](AsyncWebServerRequest *req){
    fanState = false; applyRelayStates();
    req->send(200,"text/plain","OK");
    ws.textAll(statusJSON());
  });

  server.on("/door/on", HTTP_GET, [](AsyncWebServerRequest *req){
    doorServo.write(90);
    doorOpen = true;
    req->send(200,"text/plain","OK");
    ws.textAll(statusJSON());
  });

  server.on("/door/off", HTTP_GET, [](AsyncWebServerRequest *req){
    doorServo.write(0);
    doorOpen = false;
    req->send(200,"text/plain","OK");
    ws.textAll(statusJSON());
  });

  server.on("/dht", HTTP_GET, [](AsyncWebServerRequest *req){
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    String out = "{";
    out += "\"temp\":" + String(t,1) + ",";
    out += "\"hum\":"  + String(h,1);
    out += "}";
    req->send(200,"application/json", out);
  });

  server.on("/pir", HTTP_GET, [](AsyncWebServerRequest *req){
    req->send(200, "application/json",
              String("{\"motion\":") + (motion?"true":"false") + "}");
  });

  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *req){
    req->send(200,"application/json", statusJSON());
  });

  server.begin();
  Serial.println("HTTP + WS Server ready!");
}

// ================ Loop ====================
void loop() {
  if (motion && millis() - lastMotionMs > MOTION_HOLD_MS) {
    motion = false;
    ws.textAll(statusJSON());
  }

  ws.cleanupClients();
}
