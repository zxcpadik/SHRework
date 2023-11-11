'use strict';

const { Client } = require('pg');
const create = 'CREATE TABLE IF NOT EXISTS {0} ({1})';
const add = "INSERT INTO {0} ({1}) VALUES ({2})";
const upd = "UPDATE {0} SET {1} WHERE {2}";
const del = "DELETE FROM {0} WHERE {1}";
const get = "SELECT {0} FROM {1} WHERE {2}";
const geta = "SELECT {0} FROM {1}";
const exs = "SELECT EXISTS(SELECT * FROM {0} WHERE {1})";

const DecorateNoCallback = (obj, func) => {
    return async (...args) => {
        var retn = (await new Promise((resolve, reject) => {
            func.call(obj, ...args, (err, res) => { resolve([err, res]) })
        }));

        return [...retn];
    }
}

class DBv3 {
    constructor(connect, callback) {
        this.client = new Client(connect);
        this.client.connect(callback || (() => { }));
    }


    CreateTable(name, params, callback) {
        this.client.query(create.format(name, params), callback);
    }
    Add(table, pool, values, callback) {
        this.client.query(add.format(table, pool, values), callback);
    }
    Update(table, set, condition, callback) {
        this.client.query(upd.format(table, set, condition), callback);
    }
    Delete(table, condition, callback) {
        this.client.query(del.format(table, condition), callback);
    }
    Get(table, condition, column, callback) {
        this.client.query(get.format(column, table, condition), callback);
    }
    GetRow(table, condition, callback) {
        this.client.query(get.format(column, table, condition), callback);
    }
    GetAll(table, column, callback) {
        this.client.query(geta.format(table, column), callback);
    }
    Exsist(table, condition, callback) {
        this.client.query(exs.format(table, condition), callback);
    }
    Query(request, callback) {
        this.client.query(request, callback);
    }

    ACreateTable = DecorateNoCallback(this, this.CreateTable);
    AAdd = DecorateNoCallback(this, this.Add);
    AUpdate = DecorateNoCallback(this, this.Update);
    ADelete = DecorateNoCallback(this, this.Delete);
    AGet = DecorateNoCallback(this, this.Get);
    AGetRow = DecorateNoCallback(this, this.GetRow);
    AGetAll = DecorateNoCallback(this, this.GetAll);
    AExsist = DecorateNoCallback(this, this.Exsist);
    AQuery = DecorateNoCallback(this, this.Query);
}

module.exports = {
    DBv3
};