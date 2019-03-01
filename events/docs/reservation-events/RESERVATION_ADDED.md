# Reservation Added Event
As described in [Base Event](../BASE_EVENT.md) the only field that would be described is `payload`. The `message` value will be `reservationAdded` (**camelCase**).

## Payload
Will follow the following format:
```
{
    ...
    "payload": {
        "id": string,
        "userId": string,
        "date": string,
        "people": number,
        "table": {
        	"id": string,
        	"people": number,
        },
    }
}
```
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | The reservation's id |
| `userId` | string | Yes | The user's userId that is making the reservation |
| `date` | string | Yes | The reservation's date |
| `people` | number | Yes | The number of people for which the user is reserving |
| `table.id` | string | Yes | The table's id to which the reservation is assigned |
| `table.people` | number | Yes | The table's people to which the reservation is assigned |
