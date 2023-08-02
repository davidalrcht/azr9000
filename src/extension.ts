//TODO: Save arrival time to setting.json
//TODO: Info message when work time fullfilled / time warning happens
//TODO: Save standard values to settings.json
//TODO: Slider for setting time
//TODO: Easteregg for Coffe Notification

import * as vscode from 'vscode';
import * as fs from 'fs';
import { subscribe } from 'diagnostics_channel';
const circularSlider = require("@maslick/radiaslider");
const schedule = require('node-schedule');



let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {
	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'sample.showSelectionCount';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		updateArrival();
	}));

	

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeWindowState(updateStatusBarItem));

	fetchArrivalFile();
	updateStatusBarItem();
}

const rule = new schedule.RecurrenceRule();
rule.second = 0; 
const job = schedule.scheduleJob(rule, function () {
	updateStatusBarItem();
});


var arrivalTime = setTime(0, 0);
const breakTime = setTime(0, 30);
let breakTimeTaken = setTime(0, 0);
const dailyWorkTime = setTime(7, 12);

var active = false;

async function getUserInput() {
	arrivalTime = stringToTime(await vscode.window.showInputBox({ placeHolder: "Please enter arrival time in the format (H)H:(M)M" }));
}

function fetchArrivalFile(): boolean {
	let currentTime = new Date();
	if (fs.existsSync(pathBuilder())) {
		let file = fs.readFileSync(pathBuilder(), { encoding: 'utf8' });
		let fileArrivalTime = new Date(file.toString());

		if (fileArrivalTime.getDay() === currentTime.getDay()) {
			arrivalTime = fileArrivalTime;
			active = true;
			updateStatusBarItem;
			return true;
		}
		return false;
	}
	else {
		return false;
	}
}

function pathBuilder(): string {
	let userName = getUsername();
	let userPath = "C:\\Users\\" + userName + "\\Documents\\timeOfArrival.txt";
	return userPath;
}

function getUsername() {
	return (
		process.env.SUDO_USER ||
		process.env.C9_USER ||
		process.env.LOGNAME ||
		process.env.USER ||
		process.env.LNAME ||
		process.env.USERNAME
	);
}

function updateArrival() {
	getUserInput().then(result => {
		fs.writeFile(pathBuilder(), arrivalTime.toISOString(), err => {
			if (err) {
				vscode.window.showErrorMessage("Arrival time could not be saved!");
			}
		});
		active = true;
		updateStatusBarItem;
	});
}

async function updateStatusBarItem() {
	var currentTime = new Date();

	if (!active) {
		myStatusBarItem.text = `$(sign-in) Log arrival time`;
	}
	else if (active) {
		if (!isEarlier(currentTime, setTime(13, 0))) {
			breakTimeTaken = setTime(0, 30);
		}
		myStatusBarItem.backgroundColor = "";
		myStatusBarItem.text = `$(watch) ` + timeToString(timeWorked()) + `  $(sign-out) ` + timeToString(goHomeTime());
		if (!(isEarlier(currentTime, goHomeTime()))) {

			myStatusBarItem.text = `$(watch) ` + timeToString(timeWorked()) + `  $(smiley) ` + timeToString(timeDiff(timeWorked(),dailyWorkTime));
		}
		if (!(isEarlier(timeWorked(), setTime(8, 45))) || !(isEarlier(currentTime, setTime(17, 55)))) {
			myStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
			myStatusBarItem.text = `$(watch) ` + timeToString(timeWorked()) + `  $(alert) ` + timeToString(timeDiff(timeWorked(), dailyWorkTime));;
		}
	}
	myStatusBarItem.show();
}

function isEarlier(date1: Date, date2: Date): boolean {
	if (date1.getHours() < date2.getHours()) {
		return true;
	}
	else if ((date1.getHours() === date2.getHours()) && (date1.getMinutes() < date2.getMinutes())) {
		return true;
	}
	else {
		return false;
	}
}

function goHomeTime(): Date {
	return timeAdd(timeAdd(dailyWorkTime, arrivalTime), breakTime);
}

function timeWorked(): Date {
	var currentTime = new Date();
	return timeDiff(timeDiff(currentTime, arrivalTime), breakTimeTaken);
}

function timeDiff(date1: Date, date2: Date): Date {
	let hours = date1.getHours() - date2.getHours();
	let test = date1.getMinutes();
	let test1 = date2.getMinutes();
	let minutes = date1.getMinutes() - date2.getMinutes();
	if (minutes < 0) {
		hours = hours - 1;
		minutes = 60 + minutes;
		return setTime(hours, minutes);
	}
	return setTime(hours, minutes);
}

function timeAdd(date1: Date, date2: Date): Date {
	let hours = date1.getHours() + date2.getHours();
	let minutes = date1.getMinutes() + date2.getMinutes();
	if (minutes >= 60) {
		hours = hours + Math.floor(minutes / 60);
		minutes = minutes % 60;
	}
	return setTime(hours, minutes);
}

function timeToString(date: Date): string {
	let dateString = `${date.getHours()}:${date.getMinutes()}`;
	if (date.getMinutes() <= 9) {
		dateString = `${date.getHours()}:0${date.getMinutes()}`;
	}
	return dateString;
}

function stringToTime(string: string | undefined): Date {
	if (string === undefined) {
		string = "0:0";
	}
	let stringDate = string.split(':');
	let h: number = +stringDate[0];
	let m: number = +stringDate[1];
	return setTime(h, m);
}

function setTime(hours: number, minutes: number): Date {
	let date = new Date();
	date.setHours(hours);
	date.setMinutes(minutes);
	date.setSeconds(0);
	date.setMilliseconds(0);
	return date;
}

