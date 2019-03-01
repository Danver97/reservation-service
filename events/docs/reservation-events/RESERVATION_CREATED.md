# Reservation Created Event
As described in [Base Event](../BASE_EVENT.md) the only field that would be described is `payload`. The `message` value will be `reservationCreated` (**camelCase**).

## Payload
Will follow the following format:
```
{
    ...
    "payload": {
        "id": string,
        "restId": string,
        "status": "pending",
        "statusCode": 0,
        "userId": string,
        "reservationName": string,
        "people": number,
        "date": string,
        
    }
}
```
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | The reservation's id (will have the same value of `streamId`) |
| `restId` | string | Yes | The restaurant's id where the reservation is made |
| `userId` | string | Yes | The user's userId that is making the reservation |
| `reservationName` | string | Yes | The name for the reservation |
| `people` | number | Yes | The number of people for which the user is reserving |
| `date` | string | Yes | The reservation's date |
