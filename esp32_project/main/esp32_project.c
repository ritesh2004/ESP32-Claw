#include <driver/i2c_master.h>
#include <esp_log.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <stdio.h>
#include <string.h>
#include "sdkconfig.h" // Don't miss .h extension

#include <u8g2.h>
#include "u8g2_esp32_hal.h"

// SDA - GPIO21
#define PIN_SDA 21

// SCL - GPIO22
#define PIN_SCL 22

static const char* TAG = "btc_display";

void app_main(void) {
    // Setup I2C HAL
    u8g2_esp32_hal_t u8g2_esp32_hal = U8G2_ESP32_HAL_DEFAULT;
    u8g2_esp32_hal.bus.i2c.sda = PIN_SDA;
    u8g2_esp32_hal.bus.i2c.scl = PIN_SCL;
    u8g2_esp32_hal_init(u8g2_esp32_hal);

    // Initialize Display
    u8g2_t u8g2;
    u8g2_Setup_sh1106_i2c_128x64_noname_f(&u8g2, U8G2_R0,
        u8g2_esp32_i2c_byte_cb,
        u8g2_esp32_gpio_and_delay_cb);

    u8x8_SetI2CAddress(&u8g2.u8x8, 0x78);
    ESP_LOGI(TAG, "Initializing Display...");
    u8g2_InitDisplay(&u8g2);
    u8g2_SetPowerSave(&u8g2, 0);
    u8g2_ClearBuffer(&u8g2);

    // Simulated Bitcoin Price (Value fetched on own)
    float btc_price = 64235.80;

    while (1) {
        u8g2_ClearBuffer(&u8g2);

        // Draw Header
        u8g2_SetFont(&u8g2, u8g2_font_helvR08_tr);
        u8g2_DrawUTF8(&u8g2, 2, 12, "BTC Price");

        // Draw Price Value
        char price_str[32];
        snprintf(price_str, sizeof(price_str), "$%.2f", btc_price);
        u8g2_DrawUTF8(&u8g2, 2, 30, price_str);

        // Draw Bitcoin Symbol
        u8g2_SetFont(&u8g2, u8g2_font_helvB08_tr);
        u8g2_DrawUTF8(&u8g2, 2, 45, "₿");

        u8g2_SendBuffer(&u8g2);

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}