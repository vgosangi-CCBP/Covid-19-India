const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
let districtID = 764;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      state_id as stateId,
      state_name as stateName,
      population
    FROM
      state 
    ORDER BY
      state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT
      state_id as stateId,
      state_name as stateName,
      population
    FROM
      state 
    where
      state_id=${stateId};`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray[0]);
});

//POST
app.post("/districts/", async (request, response) => {
  districtID += 1;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
      district (district_id,district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
        ${districtID},
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
        ${active},
         ${deaths}
      );`;

  const dbResponse = await db.run(addDistrictQuery);
  const bookId = dbResponse.lastID;
  console.log(dbResponse);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      district_id as districtId,
  district_name as districtName,
  state_id as stateId,
  cases,
  cured,
  active,
  deaths
    FROM
      district 
    where
      district_id=${districtId};`;
  const districtsArray = await db.all(getDistrictsQuery);
  response.send(districtsArray[0]);
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    update
      district 
   SET
       district_id= ${districtId},
        district_name='${districtName}',
         state_id=${stateId},
         cases=${cases},
         cured=${cured},
       active= ${active},
         deaths=${deaths}
         WHERE
      district_id = ${districtId};
      `;

  const dbResponse = await db.run(updateDistrictQuery);

  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    FROM
      district
    where
      state_id=${stateId};`;
  const statesArray = await db.get(getStatsQuery);
  response.send(statesArray);
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
    state.state_name as stateName
    FROM
      state inner join  district on
      state.state_id=district.state_id
    where
      district.district_Id=${districtId};`;
  const statesArray = await db.get(getStateNameQuery);
  response.send(statesArray);
});

module.exports = app;
