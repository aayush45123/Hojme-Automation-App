# Home Automation App (React Native + ESP32)

This project is a mobile application built using **React Native** that allows users to remotely control home appliances such as lights and fans, and monitor temperature and humidity using **ESP32**, **DHT11**, and an **Async Web Server**.

---

## 🚀 Features
- Toggle **Lights** ON/OFF
- Toggle **Fan** ON/OFF
- Live **temperature** updates
- Live **humidity** updates
- API communication with ESP32 using AsyncWebServer
- Clean and simple UI

---

## 📁 Project Structure
```
HomeAutomationApp/
 ├── src/
 │    ├── components/
 │    ├── screens/
 │    ├── services/
 │    └── utils/
 ├── assets/
 ├── App.js
 ├── package.json
 └── README.md
```

---

## 📡 ESP32 API Endpoints
| Function | Endpoint | Method |
|----------|-----------|--------|
| Get temperature | `/temperature` | GET |
| Get humidity | `/humidity` | GET |
| Toggle light | `/light` | POST |
| Toggle fan | `/fan` | POST |

---

## 🛠️ Tech Stack
- **React Native**
- **ESP32**
- **AsyncWebServer**
- **DHT11 Sensor**

---

## 📱 App Setup Instructions
### 1. Install dependencies
```
npm install
```

### 2. Run the app
```
npm run android
```
or
```
npm run ios
```

---

## 🔌 ESP32 Setup
Upload the provided ESP32 code (AsyncWebServer + WiFi + DHT11) to your ESP32 board.

Ensure your React Native app uses the ESP32's IP address inside API service files.
Code for ESP32 devkit available in arduino folder within home automation

---

## 🖼️ Screenshots
(Add your images here)

---

## ✨ Author
**Aayush Bharda**  
IoT Enthusiast

---

## 📄 License
MIT License
