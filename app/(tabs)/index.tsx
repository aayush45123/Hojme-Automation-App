import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [light, setLight] = useState(false);
  const [fan, setFan] = useState(false);
  const [door, setDoor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState("--");
  const [humidity, setHumidity] = useState("--");
  const [motion, setMotion] = useState(false);

  // ✅ UPDATE THIS WITH YOUR ESP32 IP
  const ESP_IP = "http://10.120.24.170";

  // ✅ Fetch DHT Sensor Data
  const fetchDHT = async () => {
    try {
      const res = await fetch(`${ESP_IP}/dht`);
      const data = await res.json();

      if (data.temp !== null && data.hum !== null) {
        setTemperature(data.temp);
        setHumidity(data.hum);
      }
    } catch (err) {
      console.log("DHT Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchDHT();
    const interval = setInterval(fetchDHT, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ WebSocket for REAL-TIME motion & device states
  useEffect(() => {
    const ws = new WebSocket("ws://10.120.24.170/ws"); // ✅ UPDATED

    ws.onopen = () => {
      console.log("✅ WebSocket Connected");
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.motion === true) {
          setMotion(true);

          Alert.alert(
            "⚠️ Motion Detected!",
            "Someone entered the room.\nTurn ON the light?",
            [
              {
                text: "Yes",
                onPress: () => {
                  setLight(true);
                  toggleDevice("light", true);
                },
              },
              { text: "No", style: "cancel" },
            ]
          );
        }

        if (data.light !== undefined) setLight(data.light);
        if (data.fan !== undefined) setFan(data.fan);
        if (data.door !== undefined) setDoor(data.door);

        if (data.temp !== undefined) setTemperature(data.temp);
        if (data.hum !== undefined) setHumidity(data.hum);

      } catch (e) {
        console.log("WS Parse Error:", e);
      }
    };

    ws.onerror = (err) => console.log("WS Error:", err);
    ws.onclose = () => console.log("❌ WebSocket Closed");

    return () => ws.close();
  }, []);

  // ================== Device Control =====================
  const toggleDevice = async (device, state) => {
    setLoading(true);

    try {
      await fetch(`${ESP_IP}/${device}/${state ? "on" : "off"}`);
    } catch (err) {
      Alert.alert("Error", "ESP32 not reachable.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Smart Home Control</Text>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Communicating…</Text>
        </View>
      )}

      <View style={styles.sensorCard}>
        <Text style={styles.sensorTitle}>🌡️ Environment</Text>
        <Text style={styles.sensorValue}>Temperature: {temperature}°C</Text>
        <Text style={styles.sensorValue}>Humidity: {humidity}%</Text>
        <Text style={styles.sensorValue}>
          Motion: {motion ? "✅ Detected" : "❌ None"}
        </Text>
      </View>

      <DeviceButton
        name="💡 Light"
        active={light}
        onPress={() => {
          const next = !light;
          setLight(next);
          toggleDevice("light", next);
        }}
      />

      <DeviceButton
        name="🌀 Fan"
        active={fan}
        onPress={() => {
          const next = !fan;
          setFan(next);
          toggleDevice("fan", next);
        }}
      />

      <DeviceButton
        name="🚪 Door"
        active={door}
        onPress={() => {
          const next = !door;
          setDoor(next);
          toggleDevice("door", next);
        }}
      />
    </View>
  );
}

function DeviceButton({ name, active, onPress }) {
  return (
    <View style={styles.deviceContainer}>
      <Text style={styles.device}>{name}</Text>
      <TouchableOpacity
        style={[styles.button, active ? styles.buttonOn : styles.buttonOff]}
        onPress={onPress}
      >
        <Text style={styles.btnText}>{active ? "ON" : "OFF"}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ================= STYLES ===================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 15,
  },
  sensorCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 3,
  },
  sensorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sensorValue: {
    fontSize: 18,
    marginBottom: 5,
  },
  deviceContainer: {
    flexDirection: "row",
    marginVertical: 12,
    alignItems: "center",
  },
  device: {
    width: 100,
    fontSize: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonOn: { backgroundColor: "#4CAF50" },
  buttonOff: { backgroundColor: "#FF5252" },
  btnText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  loadingOverlay: {
    position: "absolute",
    top: "40%",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
