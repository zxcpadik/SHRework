# Sever - SecureApi



### Secure:Auth -- Usage example
```JS
    const secure = require('./secure.js');

    secure.Auth({username: 'username', password: 'password'}, (err, res) => {
        if (err == null) console.log(res);
        else console.log(err);
    });

    res.ok      // true if no error
    res.code    // status code
    res.result  // true if exists
```

### Secure:Exists -- Usage example
```JS
    const secure = require('./secure.js');

    secure.Exsist({username: 'username'}, (err, res) => {
        if (err == null) console.log(res);
        else console.log(err);
    });

    res.ok      // true if no error
    res.code    // status code
    res.result  // true if exists
```

### Secure:Create -- Usage example
```JS
    const secure = require('./secure.js');

    secure.Create({username: 'username', password: 'password'}, (err, res) => {
        if (err == null) console.log(res);
        else console.log(err);
    });

    res.ok      // true if no error
    res.code    // status code
```

### Secure:Delete -- Usage example
```JS
    const secure = require('./secure.js');

    secure.Delete({username: 'username'}, (err, res) => {
        if (err == null) console.log(res);
        else console.log(err);
    });

    res.ok      // true if no error
    res.code    // status code
```