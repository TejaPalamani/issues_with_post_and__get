const express = require("express");

const sqlite3 = require("sqlite3");

const { open } = require("sqlite");

const path = require("path");

const app = express();

app.use(express.json());

let db = null;

const DBPath = path.join(__dirname, "covid19India.db");

const connectionToDbServer = async () => {
  try {
    db = await open({
      filename: DBPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server starting at port 3000");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

connectionToDbServer();

const convertDbObjectToResponseObject = (DbObject) => {
  return {
    stateId: DbObject.state_id,
    stateName: DbObject.state_name,
    population: DbObject.population,
    districtId: DbObject.district_id,
    districtName: DbObject.district_name,
    cases: DbObject.cases,
    cured: DbObject.cured,
    deaths: DbObject.deaths,
    active: DbObject.active,
  };
};

//get all api
app.get("/states/", async (request, response) => {
  const getQuery = `SELECT * FROM state`;

  const stateArrayDbObject = await db.all(getQuery);

  // response.send(stateArrayDbObject);

  response.send(
    stateArrayDbObject.map((eachDbObject) =>
      convertDbObjectToResponseObject(eachDbObject)
    )
  );
});

//get particular api
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getSingleQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;

  const singleDbObject = await db.get(getSingleQuery);

  response.send(convertDbObjectToResponseObject(singleDbObject));
});

//post api
app.post("/districts/", async (request, response) => {
  const postDetails = request.body;

  const { districtName, stateId, cases, deaths, cured, active } = postDetails;

  const postDetailsQuery = `INSERT INTO district
                                (district_name, state_id, cases, cured, active, deaths)
                                VALUES(
                                    
                                    '${districtName}',
                                    ${stateId},
                                    ${cases},
                                    ${deaths},
                                    ${cured},
                                    ${active}
                                )`;
  const postDbObject = await db.run(postDetailsQuery);
  response.send("District Successfully Added");
});

//get by id api
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getBYIdQuery = `SELECT * FROM district where district_id = ${districtId}`;

  const singleDbObject = await db.get(getBYIdQuery);

  //response.send(singleDbObject);

  response.send(convertDbObjectToResponseObject(singleDbObject));
});

//delete api
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteQuery = `DELETE FROM district WHERE district_id = ${districtId}`;

  const deleteResponse = await db.run(deleteQuery);

  response.send("District Removed");
});

//update api
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const putObjectDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = putObjectDetails;

  const updateQuery = `UPDATE district 
                        SET
                            district_id = ${districtId},
                            district_name = '${districtName}',
                            state_id = ${stateId},
                            cases = ${cases},
                            cured = ${cured},
                            active = ${active},
                            deaths = ${deaths}
                         Where 
                              district_id = ${districtId}
                            `;
  const updateResponse = await db.run(updateQuery);

  response.send("District Details Updated");
});

//get using sql sum api
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getSingleQuerySum = `SELECT
                                  SUM(cases),
                                  SUM(cured),
                                  SUM(deaths), 
                                  SUM(active)
                                  FROM district
                                  WHERE 
                                  state_id = ${stateId}
                                  `;
  const stats = await db.get(getSingleQuerySum);

  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getIndividualState = `SELECT state_name as stateName FROM
    state INNER JOIN district ON state.state_id = district.state_id
    where district_id = ${districtId}`;

  const getIndividualStateResponse = await db.all(getIndividualState);

  console.log(getIndividualStateResponse);

  response.send(convertDbObjectToResponseObject(getIndividualStateResponse));
});

module.exports = app;
