idf_component_register(SRCS "esp32_project.c"
                    INCLUDE_DIRS "."
                    REQUIRES cjson esp_http_client driver esp_driver_gpio esp_driver_i2c u8g2 u8g2_esp32_hal
                    esp_wifi esp_event esp_netif)
