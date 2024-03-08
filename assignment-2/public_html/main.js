function getDaysBeforeToday(x) {
  const today = new Date();
  const requiredDate = new Date(today - x * 24 * 60 * 60 * 1000);

  let year = requiredDate.getFullYear();
  let month = String(requiredDate.getMonth() + 1).padStart(2, "0");
  let day = String(requiredDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function paintDom(data, containerId, isArrival) {
  const container = document.getElementById(containerId);
  const {
    stat_num_total_flights,
    stat_num_total_places,
    stat_special_cases,
    stat_timewise_data,
    stat_top_10_list,
  } = data;

  container.innerHTML += `
    <h3 class="title">${isArrival ? "Arrival" : "Departure"}</h3>
    <table>
      <tr>
        <td><strong>Total Flights</strong></td>
        <td>${stat_num_total_flights}</td>
      </tr>
      <tr>
        <td><strong>${isArrival ? "Origins" : "Destinations"}</strong></td>
        <td>${stat_num_total_places}</td>
      </tr>
      <tr>
        <td><strong>Special Cases</strong></td>
        <td>
          ${Object.entries(stat_special_cases)
            .map((item) => {
              const [status, occurrence] = item;
              return `
              <i>${status}: ${occurrence}</i> 
            `;
            })
            .join(", ")}
        </td>
      </tr>
      <tr>
        <td><strong>${isArrival ? "Arrival" : "Departure"} Time</strong></td>
        <td>&nbsp;</td>
      </tr>
    </table>
    <div>
      ${stat_timewise_data
        .map((item) => {
          const [key, value] = Object.entries(item)[0];
          const message = isArrival ? "arrived" : "departed";
          const numFlights = value === 1 ? "flight" : "flights";

          if (key === "pr" || key == "ne") {
            return `
              <p>
                ${value !== 0 ? key : "&nbsp;"}
                <span class="tooltip" style="--width: ${value}px">
                  <em class="tooltiptext ${
                    isArrival ? "tooltiptext-left" : ""
                  }">
                  ${value} ${numFlights} ${message} ${
              key === "pr" ? "the previous day" : "the next day"
            }
                  </em>
                </span>
                <span>${value === 0 ? "" : value}</span>
              </p>
            `;
          }

          return `
            <p>
              ${key}
              <span class="tooltip" style="--width: ${value}px">
                <em class="tooltiptext ${
                  isArrival ? "tooltiptext-left" : ""
                }">${value} ${numFlights} ${message} at ${key}:00</em>
              </span>
              <span>${value === 0 ? "" : value}</span>
            </p>
          `;
        })
        .join("")}
    </div>
    <h3 class="title">Top 10 ${isArrival ? "Origins" : "Destinations"}</h3>
    <div class="scrollable">
      <table class="top10">
        <tfoot>
          <th>Code</th>
          <th>Airport</th>
          <th>Frequency</th>
        </tfoot>
        <tbody>
          ${stat_top_10_list
            .map((item) => {
              const [name, code, frequency] = item;
              return `
              <tr>
                <td>${code}</td>
                <td>${name}</td>
                <td>${frequency}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function getFlightData(date, isArrival) {
  const path = `./flight.php?date=${date}&lang=en&cargo=false&arrival=${isArrival}`;
  const res = await fetch(path);
  const data = await res.json();
  document
    .getElementsByClassName("result-container")[0]
    .classList.remove("hidden");
  return data;
}

function formatDate(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");

  return `(${day}/${month}/${year})`;
}

function getTimewiseData(flightData, isArrival) {
  const tomorrow = formatDate(
    new Date(new Date(flightData.date).getTime() + 86400000)
  );
  const yesterday = formatDate(
    new Date(new Date(flightData.date).getTime() - 86400000)
  );

  let next = 0;
  let prev = 0;
  flightData.list.forEach((flight) => {
    if (flight.status.endsWith(tomorrow)) next += 1;
    if (flight.status.endsWith(yesterday)) prev += 1;
  });

  flightData = flightData.list.filter(
    (item) =>
      item.status.startsWith(isArrival ? "At gate" : "Dep") &&
      !item.status.endsWith(")")
  );

  let obj = {};
  flightData.forEach((flight) => {
    let time;
    if (isArrival) time = flight.status.split(" ")[2].split(":")[0];
    else time = flight.status.split(" ")[1].split(":")[0];

    obj[time] = obj[time] ? obj[time] + 1 : 1;
  });

  [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
  ].map((timestamp) => {
    if (!obj[timestamp]) obj[timestamp] = 0;
  });

  let arr = Object.entries(obj)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ [key]: value }));

  arr.unshift({ pr: prev });
  arr.push({ ne: next });

  return arr;
}

async function getTop10List(flightData, isArrival) {
  let obj = {};
  let flightCodes = flightData.list.map(
    (flight) => flight[isArrival ? "origin" : "destination"][0]
  );

  flightCodes.forEach((flightCode) => {
    obj[flightCode] = obj[flightCode] ? obj[flightCode] + 1 : 1;
  });

  obj = Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const data = await fetch("./iata.json");
  const res = await data.json();

  obj.forEach((element) => {
    res.map((iata) => {
      if (iata.iata_code === element[0]) {
        element.unshift(`${iata.name}, ${iata.municipality}`);
      }
    });
  });
  return obj;
}

function getSpecialCases(flightData, isArrival) {
  flightData = flightData.list.filter(
    (flight) => !flight.status.startsWith(isArrival ? "At gate" : "Dep")
  );

  const obj = {};

  for (let i = 0; i < flightData.length; i++) {
    const { status } = flightData[i];

    if (obj[status]) obj[status] += 1;
    else obj[status] = 1;
  }

  return obj;
}

async function analyseFlightData(flightData, isArrival) {
  const stat_num_total_flights = flightData.list.length;
  const stat_num_total_places = flightData.list
    .map((flight) => flight[isArrival ? "origin" : "destination"][0])
    .filter(
      (value, index, current_value) => current_value.indexOf(value) === index
    ).length;
  const stat_special_cases = getSpecialCases(flightData, isArrival);
  const stat_timewise_data = getTimewiseData(flightData, isArrival);
  const stat_top_10_list = await getTop10List(flightData, isArrival);

  return {
    stat_num_total_flights,
    stat_num_total_places,
    stat_special_cases,
    stat_top_10_list,
    stat_timewise_data,
  };
}

async function displayResult(date) {
  const span = document.getElementById("js-flight-date");
  span.innerHTML = date;

  /* Departure Statistics */
  let isArrival = false;
  let departureFlightData = await getFlightData(date, isArrival);
  departureFlightData = departureFlightData.filter(
    (flights) => flights.date === date
  )[0];
  let data = await analyseFlightData(departureFlightData, isArrival);
  paintDom(data, "js-departure-statistics", isArrival);

  /* Arrival Statistics */
  isArrival = true;
  let arrivalFlightData = await getFlightData(date, isArrival);
  arrivalFlightData = arrivalFlightData.filter(
    (flights) => flights.date === date
  )[0];
  data = await analyseFlightData(arrivalFlightData, isArrival);
  paintDom(data, "js-arrival-statistics", isArrival);
}

function handleForm(e) {
  e.preventDefault();
  dateInput.setCustomValidity("");
  let selectedDate = dateInput.value;

  /* Validation 1: check if date field has any value */
  if (!selectedDate) {
    dateInput.setCustomValidity("Please enter a day for the search");
    dateInput.reportValidity();
    return;
  }

  /* Validation 2: check if selected date is after today */
  let maxDate = dateInput.getAttribute("max");
  if (String(selectedDate) > maxDate) {
    dateInput.setCustomValidity("Select any date before today");
    dateInput.reportValidity();
    return;
  }

  /* Validation 2: check if selected date is before minimum possible date */
  let minDate = dateInput.getAttribute("min");
  if (String(selectedDate) < minDate) {
    dateInput.setCustomValidity(`Select any date after ${minDate}`);
    dateInput.reportValidity();
    return;
  }

  displayResult(selectedDate);
  dateInput.value = null;
  return;
}

const dateInput = document.getElementById("js-date");
dateInput.setAttribute("min", getDaysBeforeToday(91));
dateInput.setAttribute("max", getDaysBeforeToday(1));
dateInput.addEventListener("click", () => {
  document.getElementById("js-flight-date").innerHTML = "";
  document.getElementById("js-departure-statistics").innerHTML = "";
  document.getElementById("js-arrival-statistics").innerHTML = "";
  document
    .getElementsByClassName("result-container")[0]
    .classList.add("hidden");
});

const submitBtn = document.getElementById("js-submit-btn");
submitBtn.addEventListener("click", handleForm);
