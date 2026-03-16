# Currency Behavior

Currency rules for this project:

- each country has a local currency
- economic facts are persisted only in local currency
- the fact does not store exchange rate
- the fact does not store converted value
- the fact does not need to store origin currency separately if the persisted country already resolves it
- the auditable financial record is always the local-currency fact

This keeps the source fact small and stable.
