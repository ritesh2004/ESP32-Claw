# AI2OTA: Prompt-to-Firmware OTA System for ESP32

🚀 Generate ESP32 firmware from natural language prompts and deploy it automatically over-the-air (OTA).

## Overview

AI2OTA is an experimental system that converts natural language prompts into ESP32 firmware using an LLM, compiles the generated code in the cloud, and automatically flashes the firmware to an ESP32 device through OTA updates.

Unlike ESP-Claw, where the LLM runs on the device, AI2OTA performs all AI processing in the cloud, making it compatible with standard ESP32-DevKit boards that have limited Flash and PSRAM.

---

## Architecture

```text
Telegram User
      │
      ▼
┌─────────────────┐
│ Telegram Handler│
└────────┬────────┘
         │
         ▼
   Prompt Queue
         │
         ▼
┌─────────────────┐
│   GLM Worker    │
│ (Code Gen LLM)  │
└────────┬────────┘
         │
         ▼
 Supabase Bucket
         │
         ▼
    Code Queue
         │
         ▼
┌─────────────────┐
│ Compiler Worker │
│  idf.py build   │
└────────┬────────┘
         │
         ▼
   Firmware (.bin)
         │
         ▼
 Supabase Bucket
         │
         ▼
    MQTT Event
         │
         ▼
┌─────────────────┐
│     ESP32       │
│ OTA Downloader  │
└─────────────────┘
```

---

## Features

* Natural language firmware generation
* Cloud-based LLM processing
* Automated ESP-IDF compilation
* OTA firmware deployment
* MQTT-based device communication
* Compatible with standard ESP32-DevKit boards
* Fully automated pipeline
* Built using free-tier services

---

## System Components

### 1. Telegram Handler

Responsible for receiving prompts from users.

**Workflow**

* Accepts `/prompt` commands from Telegram
* Extracts:

  * User prompt
  * Telegram Chat ID
* Pushes request to the `prompt_queue`

---

### 2. GLM Worker

Responsible for code generation.

**Workflow**

* Consumes tasks from `prompt_queue`
* Sends prompt to `glm-4.7-flash`
* Receives generated ESP32 firmware code
* Uploads generated `.c` file to Supabase Storage
* Pushes file URL and Chat ID to `code_queue`

---

### 3. Compiler Worker

Responsible for firmware compilation.

**Workflow**

* Consumes tasks from `code_queue`
* Downloads generated source code
* Executes:

```bash
idf.py build
```

* Generates ESP32 firmware binaries
* Uploads compiled `.bin` files to Supabase Storage
* Publishes MQTT event containing firmware URL

---

### 4. ESP32 OTA Client

Initial firmware installed manually.

**Responsibilities**

* Connect to WiFi
* Subscribe to MQTT topic
* Receive OTA update notifications
* Download firmware from Supabase
* Flash firmware using:

```cpp
#include <HTTPUpdate.h>
```

* Reboot into newly generated firmware

---

## Tech Stack

### Backend

* Node.js
* MQTT
* Message Queues

### AI

* GLM-4.7-Flash

### Storage

* Supabase Storage

### Firmware

* ESP-IDF
* HTTPUpdate Library

### Communication

* Telegram Bot API
* MQTT

---

## Workflow Example

### User Prompt

```text
Create firmware that blinks GPIO 2 every second.
```

### Pipeline

1. User sends prompt via Telegram
2. Telegram Handler pushes request to queue
3. GLM generates ESP32 firmware
4. Compiler Worker builds firmware
5. Firmware uploaded to Supabase
6. MQTT notification sent
7. ESP32 downloads firmware
8. OTA flashing starts automatically
9. Device reboots with new functionality

---

## Current Limitations

### 1. Incorrect Code Generation

Sometimes the LLM generates:

* Invalid ESP-IDF code
* Syntax errors
* Hallucinated APIs

### 2. Missing Dependencies

Generated code may include:

```cpp
#include "some_library.h"
```

that is not installed in the local ESP-IDF environment.

### 3. Build Failures

Compilation may fail due to:

* Missing components
* Invalid project structure
* Unsupported APIs

---

## Future Improvements

### Smarter Code Generation

* Better prompting
* RAG-based component retrieval
* Fine-tuned firmware model

### Self-Healing Build Pipeline

* Parse compiler errors
* Send errors back to LLM
* Auto-regenerate fixed code
* Retry compilation

### Dependency Management

* Automatic library detection
* Dynamic component installation

### Security

* Signed firmware updates
* Device authentication
* Secure MQTT communication

---

## Difference from ESP-Claw

| Feature              | ESP-Claw           | AI2OTA         |
| -------------------- | ------------------ | -------------- |
| LLM Location         | On Device          | Cloud          |
| Hardware Requirement | High Memory ESP32  | Standard ESP32 |
| PSRAM Requirement    | 8 MB               | Not Required   |
| Flash Requirement    | 8 MB               | Standard ESP32 |
| Cost                 | Hardware Dependent | Mostly Free    |
| OTA Support          | Yes                | Yes            |

---

## Motivation

The goal of this project was to build a completely automated AI-to-firmware pipeline that works on affordable ESP32 development boards while keeping operational costs close to zero.

By leveraging:

* GLM-4.7-Flash
* Supabase Storage
* MQTT
* ESP-IDF

the entire workflow can run using free-tier infrastructure for experimentation and research.

---

## Disclaimer

This project is experimental and intended for educational and research purposes. AI-generated firmware can contain errors and should be reviewed before deployment in production environments.
