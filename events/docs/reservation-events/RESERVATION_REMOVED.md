# Reservation Removed Event
As described in [Base Event](../BASE_EVENT.md) the only field that would be described is `payload`. The `message` value will be `reservationRemoved` (**camelCase**).

## Payload
Will follow the following format:
```
{
    ...
    "payload": {
        "restId": string,
        "resId": string,
    }
}
```
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `restId` | string | Yes | The restaurant's id where the reservation is made (will have the same value of `streamId`) |
| `resId` | string | Yes | The reservation's id |
