import config from './config';
import {userAPI, User} from './userAPI';
import { exists } from 'fs';
import * as moment from 'moment';

require('dotenv').config();

const { RTMClient } = require('@slack/rtm-api');

// Read a token from the environment variables
const token = config.chat.authToken

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

var glob = require("glob")

const options = {}

const lessThanTwoMonthAgo = (date:any) => {
    return moment(date).isAfter(moment().subtract(2, 'month'));
}
async function start () {

    let users : User[] = await userAPI.getUsers();
    let presence:any = []

    let DBFiles = glob.sync("db/db*.json")

    for (let aFile of DBFiles ) {
        const adapter = new FileSync(aFile)
        const db = low(adapter)
        await db.read()
        presence = presence.concat(db.get('usersActivity')
            .value())
    }

    for (let aSlackUser of users) {
        let presenceToCheck = presence.find ( (aPresence:any)=> {
            return (aPresence.id==aSlackUser.id)
        })
        if ((presenceToCheck == undefined) || (
            (presenceToCheck != undefined) && (!lessThanTwoMonthAgo(presenceToCheck.tsLastActive)))) {
            console.log (`User ${aSlackUser.name} <${aSlackUser.email}> : ${presenceToCheck!=undefined?presenceToCheck.tsLastActive:"Unknown"}`)
        }
    }
    console.log ("Total number os users : "+users.length)
    console.log ("Total number of users with presence detected :"+presence.length)
}

(async () => {
    await start(); 
})();






