# PostgreSQL understood as relational fit for restaurant data

The user now understands why a relational database fits Sembilu: the data is inherently relational (orders have items, items belong to branches, reservations are for tables at specific branches). Primary keys as unique identifiers and foreign keys as "threads" connecting tables were the key concepts. The concrete example using Sembilu's actual branches (Tegal, Slawi, Semarang, Jakarta) from data.ts made it click.

**Implication:** Can now move to designing the actual schema and setting up Express + PostgreSQL together.
