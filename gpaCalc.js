/*
This file let us calculate the GPA.
*/

// start processing data when user clicks on the
let btn_upload = document
	.getElementById("btn-upload-csv")
	.addEventListener("click", () => {
		// convert the CSV to a an object we can work with using papa parse
		Papa.parse(document.getElementById("upload-csv").files[0], {
			download: true,
			header: true,
			complete: function (results) {
				console.log(results);

				// get current year of stuying of student
				const currentYear = document.querySelector(
					'input[name="current-year"]:checked'
				).value;
				console.log("current year: ", currentYear);

				let uwSumOfWeights = 0;
				let uwSumOfWeightedGrades = 0;

				let sumOfWeights = {
					1: 0,
					2: 0,
					3: 0,
					4: 0,
				};

				let sumOfWeightedGrades = {
					1: 0,
					2: 0,
					3: 0,
					4: 0,
				};

				let cGPAofYear = {
					1: 0,
					2: 0,
					3: 0,
					4: 0,
				};

				// this is an object of arrays representing the marks of each year
				// TODO I might need to pair the marks with the weights to know which courses to remove that account for the worst 1.0 credit
				let OMSASgradesForYear = {
					1: [],
					2: [],
					3: [],
					4: [],
				};

				// read the marks and do initial processing
				results.data.forEach((course) => {
					// do this if statement to account for excel saving an empty line
					if (course.course.length > 0) {
						// convert the data into numbers to do math on them
						const weight = Number(course.weight);
						const grade = Number(course.grade);
						const year = Number(course.year);

						// get the UW average
						uwSumOfWeights += weight;
						uwSumOfWeightedGrades += grade * weight;

						// better way of calculating cGPA
						sumOfWeights[year] += weight;
						sumOfWeightedGrades[year] += grade * weight;

						const omsasGrade = getOMSASgradeFromUWpercentage(grade);

						// return an error message if a grade is not between 0 and 100
						// TODO make this not execute any code after the loop and just display error
						if (omsasGrade == -1) {
							console.log("I detected a bad number");
							document.getElementById(
								"GPA"
							).innerHTML = `<p>Your grade for ${course} must be between 0 and 100.</p>`;
							return -1;
						}

						OMSASgradesForYear[year].push(omsasGrade);
					}
				});

				console.log(OMSASgradesForYear);

				// TODO use the OMSAS equivalent grades to get the GPA
				// I am using logic found at https://www.premedontario.com/omsas-gpa-calculator

				const UWavg = uwSumOfWeightedGrades / uwSumOfWeights;
				const cGPA = getOMSASgradeFromUWpercentage(UWavg);

				// claculate the individual cGPA's of each year
				[1, 2, 3, 4].forEach((year) => {
					const avgOfYear = sumOfWeightedGrades[year] / sumOfWeights[year];
					console.log("avg of year ", year, ": ", avgOfYear);
					cGPAofYear[year] = Number.isNaN(avgOfYear)
						? 0
						: getOMSASgradeFromUWpercentage(avgOfYear);
					console.log("cGPA of year ", year, ": ", cGPAofYear[year]);
				});

				const AlbertaGPA = cGPA; // I could not find any special instructions for uAlberta so I am assuming it is Cumulative GPA
				const UOttawaGPA = getOttawaGPA(cGPAofYear, currentYear); // getOttawaGPA(OMSASgradesForYear, currentYear);
				const WesternGPA = getWesternGPA(cGPAofYear);
				const MacMasterGPA = cGPA;
				const UofTGPA = 0;
				const QueensGPA = 0;
				const MonitobaGPA = cGPA;
				const UBCGPA = 0;

				// construct the inner HTML of the list displaying the different GPAs
				const gpaList = `	 
				<p>Your GPA is:</p>
				<ul>
					<li><strong>Univeristy of Waterloo</strong>: ${UWavg.toFixed(2)} %</li>
					<li><strong>Cumulative GPA</strong>: ${cGPA.toFixed(2)} </li>
					<li><strong>Univeristy of Ottawa</strong>: ${UOttawaGPA.toFixed(2)} </li>
					<li><strong>University of Alberta</strong>: ${AlbertaGPA.toFixed(2)}</li>
					<li><strong>Western University</strong>: ${WesternGPA.toFixed(2)} </li>
					<li><strong>MacMaster University</strong>: ${MacMasterGPA.toFixed(2)}</li>
					<li><strong>UofT</strong>: ${UofTGPA.toFixed(2)}</li>
					<li><strong>Queen's University</strong>: ${QueensGPA.toFixed(2)}</li>
					<li><strong>University of Manitoba</strong>: ${MonitobaGPA.toFixed(2)}</li>
					<li><strong>UBC</strong>: ${UBCGPA.toFixed(2)}</li>
							
				<ul>`;

				// print the GPA of the different schools on the HTML page
				document.getElementById("GPA").innerHTML = gpaList;
			},
		});
	});

/**
 *
 * @param {Number} uwGrade a grade between 0 and 100.
 *
 * @returns {Number} OMSAS GPA equivalent
 */
function getOMSASgradeFromUWpercentage(uwGrade) {
	if (uwGrade < 0) return -1; // error code if grade is less than 0
	if (uwGrade <= 49) return 0.0;
	if (uwGrade <= 52) return 0.7;
	if (uwGrade <= 56) return 1.0;
	if (uwGrade <= 59) return 1.3;
	if (uwGrade <= 62) return 1.7;
	if (uwGrade <= 66) return 2.0;
	if (uwGrade <= 69) return 2.3;
	if (uwGrade <= 72) return 2.7;
	if (uwGrade <= 76) return 3.0;
	if (uwGrade <= 79) return 3.3;
	if (uwGrade <= 84) return 3.7;
	if (uwGrade <= 89) return 3.9;
	if (uwGrade <= 100) return 4.0;
	return -1; // error code if grade is more than 100
}

/**
 *
 * @param {Object} cGPAofYear an object that has 4 keys [1,2,3,4], where each value represents the cGPA of this year
 * @param {Number} currentYearOfStudy the current year of (undergrad) studies of the student (Ottawa wants 3, 4, or up)
 *
 * @returns {Number} the GPA that the University of Ottawa sees.
 * According to https://www.premedontario.com/omsas-gpa-calculator,
 * the way uOttawa calculates this is by weighing the cGPA's of each year
 * and dividing it by a factor given by the university of Ottawa.
 */
function getOttawaGPA(cGPAofYear, currentYearOfStudy) {
	// TODO handle the case when it returns -1 to say that calculation only works if u r in 3rd year and above
	const ottawaDividingFactor = getOttawaGPADivider(currentYearOfStudy);

	// calculate the weighted cGPA of each year
	const numerator =
		cGPAofYear[1] + cGPAofYear[2] * 2 + cGPAofYear[3] * 3 + cGPAofYear[4] * 4;

	return numerator / ottawaDividingFactor;
}

/**
 *
 * @param {Number} currentYearOfStudy which year of study the student is currently in.
 * it seems like they only care for students who are in their 3rd of 4th year
 *
 * @returns {Number} divider given by U Ottawa
 * - 3 if student is in 3rd year,
 * - 6 if in 4th year,
 * - 10 if higher (a.k.a. student finished 4 years of undergrad), and
 * - -1 if the student's current year is less than 3.
 */
function getOttawaGPADivider(currentYearOfStudy) {
	console.log("current yeat from divider function: ", currentYearOfStudy);
	// const year = parseInt(currentYearOfStudy, 10);
	// currentYearOfStudy = Number(currentYearOfStudy);
	if (currentYearOfStudy < 3) return -1; // it seems like they only consider ppl in 3rd year and above
	if (currentYearOfStudy == 3) return 3;
	if (currentYearOfStudy == 4) return 6;
	return 10; // if student is done their 4 years of undergrad, the factor is 10
}

/**
 *
 * @param {Object} cGPAofYear an object that has 4 keys [1,2,3,4], where each value represents the cGPA of this year
 *
 * @returns {Number} the GPA seen by the Univeresity of Western
 */
function getWesternGPA(cGPAofYear) {
	// get the two highest cGPA's of the 4 years of the student
	const [highestGPA, secondHighestGPA] = getBiggestAndSecondBiggest([
		cGPAofYear[1],
		cGPAofYear[2],
		cGPAofYear[3],
		cGPAofYear[4],
	]);

	console.log("two highest cGPAs are: ", highestGPA, secondHighestGPA);

	return (highestGPA + secondHighestGPA) / 2;
}

/*
Based on the functions of the calculator found at https://www.premedontario.com/omsas-gpa-calculator,
*/
function getUofTGPA() {}

/**
 *
 * @param {Array} arr array of numbers.
 *
 * @returns {Number} the sum of numbers in this array.
 */
function getSumOfArray(arr) {
	return arr.reduce(function (a, b) {
		return a + b;
	}, 0);
}

/**
 *
 * @param {Array} arr
 *
 * @returns {Number} the average of the numbers in this array.
 * If the array is empty, it returns 0.
 */
function getAverageOfArray(arr) {
	if (arr.length == 0) return 0;
	let total = 0;
	for (let i = 0; i < arr.length; i++) {
		total += arr[i];
	}
	return total / arr.length;
}

/**
 *
 * @param {Array} arr array of numbers
 *
 * @returns {Array} array of two numbers: the highest and second highest number in this array.
 */
function getBiggestAndSecondBiggest(arr) {
	// initialize max and second biggest as the smallest number possible (-inifinity)
	// to do comparisons later
	console.log("I am finding the 2 top marks from ", arr);
	let max = -Infinity,
		secondBiggest = -Infinity;

	for (const value of arr) {
		const nr = Number(value); // parse the value of the array as a number

		if (nr > max) {
			[secondBiggest, max] = [max, nr]; // save previous max
		} else if (nr < max && nr > secondBiggest) {
			secondBiggest = nr; // new second biggest
		}
	}

	return [max, secondBiggest];
}

/**
 *
 * @param {Array} arr array of numbers
 *
 * @returns {Array} array of two numbers: the lowest and second lowest number in this array.
 */
function getSmallestAndSecondSmallest(arr) {
	// initialize max and second biggest as the biggest number possible (inifinity)
	// to do comparisons later
	let min = Infinity,
		secondSmallest = Infinity;

	for (const value of arr) {
		const nr = Number(value); // parse the value of the array as a number

		if (nr < min) {
			[secondSmallest, min] = [min, nr]; // save previous min
		} else if (nr > min && nr < secondSmallest) {
			secondSmallest = nr; // new second smallest
		}
	}
	return [min, secondSmallest];
}

/*
https://meds.queensu.ca/academics/undergraduate/prospective-students/applying/application-process
*/
function getQueensGPA() {}

/*
https://mdprogram.med.ubc.ca/admissions/evaluation-criteria/
*/
function getUBCgpa() {}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// 									         L E G A C Y
/////////////////////////////////////////////////////////////////////////////////////////////////////

/*
This function takes an object(arrayofCoursesPerYear) that has key:value pairs denoting 
- int(year):arr[float](GPAs of courses in this year)

The caluclation of the Cumulative GPA as seen at https://www.premedontario.com/omsas-gpa-calculator
simply finds the average of all those GPAs.
*/
function getCumulativeGPA(arrayOfCoursesPerYear) {
	let numberOfCourses =
		arrayOfCoursesPerYear[1].length +
		arrayOfCoursesPerYear[2].length +
		arrayOfCoursesPerYear[3].length +
		arrayOfCoursesPerYear[4].length;

	let sumOfGPAs = 0;

	arrayOfCoursesPerYear[1].forEach((gpa) => {
		sumOfGPAs += gpa;
	});
	arrayOfCoursesPerYear[2].forEach((gpa) => {
		sumOfGPAs += gpa;
	});
	arrayOfCoursesPerYear[3].forEach((gpa) => {
		sumOfGPAs += gpa;
	});
	arrayOfCoursesPerYear[4].forEach((gpa) => {
		sumOfGPAs += gpa;
	});

	return sumOfGPAs / numberOfCourses;
}

/*
This function takes 2 arguments:
- an object(arrayOfCoursesPerYear) that has key:value pairs denoting 
-- int(year):arr[float](GPAs of courses in this year)
- an int(currentYearOfStudy): an integer that denotes the current year of study of the student
-- it seems like the Ottawa algorithm only cares for students in third year and up

It returns the GPA seen by the university of Ottawa.
According to https://www.premedontario.com/omsas-gpa-calculator,
the way uOttawa calculates this is by weighing the cGPA's of each year
and dividing it by a factor given by the university of Ottawa.
*/
function getOttawaGPA_LEGACY(arrayOfCoursesPerYear, currentYearOfStudy) {
	// get the culumative GPA of each year
	const firstYearCGPA = getAverageOfArray(arrayOfCoursesPerYear[1]);
	console.log("first year GPA: ", firstYearCGPA);
	const secondYearCGPA = getAverageOfArray(arrayOfCoursesPerYear[2]);
	const thirdYearCGPA = getAverageOfArray(arrayOfCoursesPerYear[3]);
	const fourthYearCGPA = getAverageOfArray(arrayOfCoursesPerYear[4]);
	console.log("fourth year GPA: ", fourthYearCGPA);

	// TODO handle the case when it returns -1 to say that calculation only works if u r in 3rd year and above
	const ottawaDividingFactor = getOttawaGPADivider(currentYearOfStudy);

	// calculate the weighted cGPA of each year
	const numerator =
		firstYearCGPA + secondYearCGPA * 2 + thirdYearCGPA * 3 + fourthYearCGPA * 4;

	// if(!Number.isNaN(firstYearCGPA)) numerator += firstYearCGPA;
	// if(!Number.isNaN(firstYearCGPA)) numerator += secondYearCGPA ;
	// if(!Number.isNaN(firstYearCGPA)) numerator += thirdYearCGPA * 3;
	// if(!Number.isNaN(firstYearCGPA)) numerator += fourthYearCGPA * 4;

	console.log(
		"numerator: ",
		numerator,
		", denominator: ",
		ottawaDividingFactor
	);

	return numerator / ottawaDividingFactor;
}
