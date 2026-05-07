#include <WiFi.h>
#include <HTTPUpdate.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "[SSID]";
const char* password = "[PASSWORD]";

#define MQTT_BROKER "d85b561d6bee461aa99610eaXXXXXX.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "esp32-claw"
#define MQTT_PASSWORD "esp32-Claw"
#define MQTT_TOPIC "device/esp32/update"

WiFiClientSecure espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;

  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  Serial.println("MQTT Message:");
  Serial.println(msg);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, msg);

  if (error) {
    Serial.println("JSON parse failed");
    return;
  }

  const char* url = doc["url"];

  if (url) {
    Serial.println(url);

    espClient.setInsecure(); 

    Serial.println("Starting OTA...");
    t_httpUpdate_return ret = httpUpdate.update(espClient, url);

    switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("Error (%d): %s\n",
      httpUpdate.getLastError(),
      httpUpdate.getLastErrorString().c_str());
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("No update");
      break;

    case HTTP_UPDATE_OK:
      Serial.println("Update success");
      break;
  }
  }
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP32Client - MyClient";
    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      client.subscribe(MQTT_TOPIC);
      Serial.println("Connected with MQTT");
    } else {
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }

  Serial.println("Connected with WiFi!");

  espClient.setInsecure();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
}