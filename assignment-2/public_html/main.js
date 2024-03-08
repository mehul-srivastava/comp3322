// DON'T CHANGE ANYTHING
function getDaysBeforeToday(x) {
  const today = new Date();
  const requiredDate = new Date(today - x * 24 * 60 * 60 * 1000);

  let year = requiredDate.getFullYear();
  let month = String(requiredDate.getMonth() + 1).padStart(2, "0");
  let day = String(requiredDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// DON'T CHANGE ANYTHING
async function getFlightData(date, isArrival) {
  const path = `./flight.php?date=${date}&lang=en&cargo=false&arrival=${isArrival}`;
  const res = await fetch(path);
  const data = await res.json();
  document
    .getElementsByClassName("result-container")[0]
    .classList.remove("hidden");
  return data;
}

// DON'T CHANGE ANYTHING
function getTimewiseData(flightData) {
  let obj = {};
  flightData.list.forEach((flight) => {
    let time = flight.time.split(":")[0];
    obj[time] = obj[time] ? obj[time] + 1 : 1;
  });
  return obj;
}

// DON'T CHANGE ANYTHING
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

// DON'T CHANGE ANYTHING
async function analyseFlightData(flightData, isArrival) {
  const stat_heading = flightData.date;
  const stat_num_total_flights = flightData.list.length;
  const stat_num_total_places = flightData.list
    .map((flight) => flight[isArrival ? "origin" : "destination"][0])
    .filter(
      (value, index, current_value) => current_value.indexOf(value) === index
    ).length;
  const stat_num_cancelled_flights = flightData.list.filter(
    (flight) => flight.status === "Cancelled"
  ).length;
  const stat_top_10_list = await getTop10List(flightData, isArrival);
  const stat_timewise_data = getTimewiseData(flightData);

  return {
    stat_heading,
    stat_num_total_flights,
    stat_num_total_places,
    stat_num_cancelled_flights,
    stat_top_10_list,
    stat_timewise_data,
  };
}

// DON'T CHANGE ANYTHING
async function displayResult(date) {
  /* Departure Statistics */
  let isArrival = false;
  let departureFlightData = await getFlightData(date, isArrival);
  departureFlightData = departureFlightData.filter(
    (flights) => flights.date === date
  )[0];

  /* Arrival Statistics */
  // isArrival = false;
  // let arrivalFlightData = await getFlightData(date, isArrival);
  // arrivalFlightData = arrivalFlightData.filter(
  //   (flights) => flights.date === date
  // )[0];
}

// DON'T CHANGE ANYTHING
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

const submitBtn = document.getElementById("js-submit-btn");
submitBtn.addEventListener("click", handleForm);
