const mongoose = require("mongoose");

mongoose.connect("mongodb://ajibbola007:Sterling77@ac-wvjqpv2-shard-00-00.fcsnpw4.mongodb.net:27017,ac-wvjqpv2-shard-00-01.fcsnpw4.mongodb.net:27017,ac-wvjqpv2-shard-00-02.fcsnpw4.mongodb.net:27017/?ssl=true&replicaSet=atlas-d0y9r0-shard-0&authSource=admin&appName=Clusterj")
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

module.exports = mongoose;