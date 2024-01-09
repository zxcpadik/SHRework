Postgres - USERS scheme

``` SQL
    create table users (
      UserID bigserial unique NOT NULL,
      username varchar(32) unique NOT NULL,
      password VARCHAR (1024) NOT NULL,
      lastauth timestamp
    )
```
