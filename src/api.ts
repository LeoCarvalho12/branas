import crypto from "crypto";
import express from 'express';
import pgp from "pg-promise";
import { validate } from "./validateCpf";
const app = express();
app.use(express.json());
 
const connectionPostgres = "postgres://postgres:123456@localhost:5432/postgres";
const randomId = () => crypto.randomUUID();

class Database{
constructor( readonly connectionDB: any){
	this.connectionDB = pgp()(connectionDB);
}
async querySelect(req : any){
	return  await this.connectionDB.query("select * from cccat16.account where email = $1", [req.body.email]); 
}
async queryInsert(req : any){
	return await this.connectionDB.query("insert into cccat16.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver) values ($1, $2, $3, $4, $5, $6, $7)", [randomId(), req.body.name, req.body.email, req.body.cpf, req.body.carPlate, !!req.body.isPassenger, !!req.body.isDriver]);
}
async close(): Promise<void> {
	await this.connectionDB.$pool.end();
}
}

class UserAccount{
	id: string;
	name: string
	email: string
	cpf: string
	carPlate: string
	isPassenger: boolean
	isDriver: boolean

	constructor(id: string, name:string, email:string, cpf:string, carPlate:string, isPassager:boolean, isDriver: boolean){
		this.id = id
		this.name = name
		this.email = email
		this.cpf = cpf
		this.carPlate = carPlate
		this.isPassenger = isPassager
		this.isDriver = isDriver
	}
} 

app.post("/signup", async function (req, res) {
	let result;
	const database = new Database(connectionPostgres)
	try {
		if (!!database.querySelect(req))result = -4;
			if (!req.body.name.match(/[a-zA-Z] [a-zA-Z]+/))result = -3;
				if (!req.body.email.match(/^(.+)@(.+)$/))result = -2;
					if (!validate(req.body.cpf))result = -1;
						if (req.body.isDriver) {
							if (!req.body.carPlate.match(/[A-Z]{3}[0-9]{4}/)) result = -5;
              database.queryInsert(req)
								result = randomId;
						} else {
							database.queryInsert(req)
							result = randomId;
						}
		if (typeof result === "number") {
			res.status(422).send(result + "");
		} else {
			res.json(result);
		}
	} finally {
		await database.close();
	}
});
app.listen(3000);