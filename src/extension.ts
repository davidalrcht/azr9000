//TODO: Save arrival time to file (setting.json)
//TODO: Info message when work time fullfilled / time warning happens

import { start } from 'repl';
import * as vscode from 'vscode';

let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {

	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'sample.showSelectionCount';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		const n = 5;
		vscode.window.showInformationMessage(`Yeah, ${n} line(s) selected... Keep going!`);
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();
}

var arrivalTime = setTime(10, 7);
const breakTime = setTime(0, 30);
let breakTimeTaken = setTime(0, 30);
const dailyWorkTime = setTime(7, 12);

var active = false;

function updateStatusBarItem(): void {
	var currentTime = new Date();

	if (!active) {
		arrivalTime = stringToTime(vscode.window.showInputBox());
		active = true;
		updateStatusBarItem
	}

	if (active) {
		myStatusBarItem.text = `$(watch) ` + timeToString(timeWorked()) + `  $(sign-out) ` + timeToString(goHomeTime());
	}
	if (!(isEarlier(currentTime, goHomeTime()))) {
		myStatusBarItem.text = `$(smiley) ` + timeToString(timeWorked());
	}
	if (!(isEarlier(timeWorked(), setTime(8, 45))) || !(isEarlier(currentTime, setTime(17, 55)))) {
		myStatusBarItem.text = `$(alert) Time warning! `;
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

function timeToString(date: Date): String {
	let dateString = `${date.getHours()}:${date.getMinutes()}`;
	if (date.getMinutes() <= 9) {
		dateString = `${date.getHours()}:0${date.getMinutes()}`;
	}
	return dateString;
}

function stringToTime(string: string | undefined): Date {
	if(string === undefined){
		string =  "0:0";
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
	return date;
}

