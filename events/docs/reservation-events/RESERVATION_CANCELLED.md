# Reservation Cancelled Event
As described in [Base Event](../BASE_EVENT.md) the only field that would be described is `payload`. The `message` value will be `reservationCancelled` (**camelCase**).

## Payload
Will follow the following format:
```
{
    ...
    "payload": {
        "resId": string,
        "restId": string,
        "status": "cancelled",
    }
}
```
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `resId` | string | Yes | The reservation's id (will have the same value of `streamId`) |
| `restId` | string | Yes | The restaurant's id |
