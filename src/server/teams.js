const mongo = require("mongodb").MongoClient;
const mongourl = "mongodb://pickup:cs115@ds251819.mlab.com:51819/pickup"

function printErr(err, message)
{
    console.log("Error: ", message);
    console.log(err);
    console.log("\nReturning to normal function");
}


exports.getTeams = function getTeams(req, res) {
    console.log('[', (new Date()).toLocaleTimeString(), "] Retrieving teams");

    mongo.connect(mongourl, (err, client) => {
        if (err) {
            printErr(err, "Connection to mongo failed for retrieving teams");
            client.close();
            res.sendStatus(500);
            return;
        }

        let teams = client.db("pickup").collection("teams");
        teams.find({}).toArray( (err, results) => {
            if (err)
            {
                printErr(err, "retrieving team failed");
                res.sendStatus(500);
            }
            else
            {
                res.status(200);
                res.json(results);
            }
            client.close();
        });

    });
}

exports.createTeam = function createTeam(req, res) {
    console.log('[', (new Date()).toLocaleTimeString(), "] Team creating");

    let team = {
        sport: req.body.sport,
        name: req.body.name,
        city: req.body.city,
        captain: req.body.captain,
        members: [req.body.captain],
        games: []
    }

    mongo.connect(mongourl, (err, client) => {
        if (err) {
            printErr(err, "Connection to mongo failed for creating Team");
            client.close();
            res.sendStatus(500);
            return;
        }

        let teams = client.db("pickup").collection("teams");
        let users=client.db("pickup").collection("users");
        teams.insertOne(team, (err) => {
            if (err)
            {
                printErr(err, "Adding team failed");
                res.sendStatus(500);
            }
            else
            {
                users.update({"username":{$in:team["members"]}},{
                    $push:{"teams":team["name"]}
                },(err)=>{
                  if(err){
                    printErr(err);
                    res.sendStatus(500);
                  }
                  else{
                    res.sendStatus(200);
                  }
                })

            }
        });

    });

}


// adds the member to the team
exports.joinTeam = function joinTeam(req,res) {

    mongo.connect(mongourl, (err, client) => {
        if (err) {
            printErr(err, "Connection to mongo failed for joining Team");
            client.close();
            res.sendStatus(500);
            return;
        }

        let teamQuery = {name: req.body.teamName};
        let newMember = { $addToSet: {members: req.body.user} }

        let teams = client.db("pickup").collection("teams");
        let users=client.db("pickup").collection("users");
        teams.updateOne(teamQuery, newMember, (err) => {
            if (err)
            {
                printErr(err, "Joining team failed");
                res.sendStatus(500);
            }
            else
            {
              users.updateOne({"username":req.body.user},{
                  $addToSet:{"teams":req.body.teamName}
              },(err)=>{
                if(err){
                  printErr(err);
                  res.sendStatus(500);
                }
                else{
                  console.log('[', (new Date()).toLocaleTimeString(), "] Team joined");
                  res.sendStatus(200);
                }
              })

            }
            client.close();
        });

    });


}

// removes a user from the members list, deletes the team if it
exports.leaveTeam = function leaveTeam (req, res) {
    console.log('[', (new Date()).toLocaleTimeString(), "] Team leaving");

    mongo.connect(mongourl, (err, client) => {
        if (err) {
            printErr(err, "Connection to mongo failed for leaving Team");
            client.close();
            res.sendStatus(500);
            return;
        }

        let teamQuery = {name: req.body.teamName};
        let newMember = { $pull: {members: req.body.user} }

        let teams = client.db("pickup").collection("teams");
        teams.findOneAndUpdate(teamQuery, newMember, (err, result) => {
            if (err)
            {
                printErr(err, "Leaving team failed");
                res.sendStatus(500);
                client.close();
                return;
            }
            if (result == null)
            {
                console.log ("Team \"",req.body.teamName, "\" not found. Unable to leave");
            }


            let team = result.value;
            if (team.captain == req.body.user) {
                teams.deleteOne(teamQuery, (err) => {
                    if (err)
                    {
                        printErr(err, "Deleting captainless team failed");
                        res.sendStatus(500);
                    }
                    else
                    {
                        console.log('[', (new Date()).toLocaleTimeString(), "] Deleting team");
                        res.sendStatus(200);
                    }
                    client.close();
                });
            }
            else {
                res.sendStatus(200);
                client.close();
            }

        });

    });


}
