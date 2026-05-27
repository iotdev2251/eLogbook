DB.md




create table GATEWAY(
    NAME,
    ID,
    MAC,
    TOPIC,
    CHECKPOINT_FLAG
)

create table BEACON(
    NAME,
    ID,
    MAC,
)

create table BEACON_DATA(
    BEACON_ID,
    REPORT_TIME,
    TEMPERATURE,
    BATTERY,
    RSSI,
    IN_OUT_STATUS,
    ALERT_FLAG,

)

create table PARAM(
    KEY,
    VALUE
)