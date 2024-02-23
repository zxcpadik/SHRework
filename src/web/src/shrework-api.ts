import React from "react";

export module SHReworkAPI {
  function APIHost(): string {
    //return "https://" + window.location.host;
    return "https://sh-rework.ru";
  }

  export function SecureAuth(credentials: Credentials): Promise<SecureResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  export function SecureCreate(
    credentials: Credentials
  ): Promise<SecureResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  export function SecureUpdate(
    credentials: Credentials,
    newpassword: string
  ): Promise<SecureResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...credentials, newpassword }),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  export function SecureDelete(
    credentials: Credentials
  ): Promise<SecureResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  // TICKET

  export function TicketPush(
    credentials: Credentials,
    ticket: Ticket
  ): Promise<TicketResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...credentials, ...ticket }),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  export function TicketPull(
    credentials: Credentials,
    offset?: number,
    count?: number
  ): Promise<TicketResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/pull", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...credentials, offset, count }),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  export function TicketFlush(
    credentials: Credentials
  ): Promise<TicketServiceResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/flush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  export function TicketLast(
    credentials: Credentials
  ): Promise<TicketServiceResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3/last", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }

  // SYSTEM

  export function ApiVersion(): Promise<TicketServiceResult> {
    return new Promise((resolve, reject) => {
      fetch(APIHost() + "/api/v3", {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => resolve({ok: false, status: -1}));
    });
  }
}

export class Credentials {
  public username?: string;
  public password?: string;

  constructor(Username?: string, Password?: string) {
    this.username = Username ? Username?.toLowerCase() : undefined;
    this.password = Password;
  }
}

export class SecureResult {
  public ok: boolean = false;
  public status: number = -1;
  public user?: User;
}

export class TicketResult {
  public ok: boolean = false;
  public status: number = -1;
  public tickets?: Ticket[];
}

export class TicketServiceResult {
  public ok: boolean = false;
  public status: number = -1;
  public count?: number;
}

export class Ticket {
  public GlobalID?: number;
  public SourceID?: number;
  public DestinationID?: number;
  public TicketID?: number;
  public ResponseID?: number;
  public Data?: string;
  public Date?: Date;
}

export class User {
  ID: number = -1;
  Username: string = "";
  Password: string = "";
  LastAuth?: Date;
}

export class ApiVersionResult {
  public ok: boolean = false;
  public status: number = -1;
  public version?: number;
}
