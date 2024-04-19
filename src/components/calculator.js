import { Component } from "preact";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { FormControl, FormLabel, IconButton, List, ListItem, TextField } from "@mui/material";
import dayjs from "dayjs";

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

export default class Calculator extends Component {
    constructor() {
        super()
        this.state = {
            days: {
                'Mon': "8",
                'Tue': "8",
                'Wed': "8",
                'Thu': "8"
            },
            start: dayjs().hour(8).minute(0),
            lunchStart: dayjs().hour(12).minute(0),
            lunchEnd:  dayjs().hour(13).minute(0),
            end:  dayjs().hour(17).minute(0),
            target: 40,
            lock: true
        }
    }

    get morning() {
        return this.state.lunchStart.diff(this.state.start, 'hour', true)
    }

    get afternoon() {
        return this.state.end.diff(this.state.lunchEnd, 'hour', true)
    }

    get lunch() {
        return this.state.lunchEnd.diff(this.state.lunchStart, 'hour', true)
    }

    get total() {
        const days = Object.values(this.state.days).map((v) => parseFloat(v) || 0).reduce((a,b) => a + b)
        return this.displayNumber(days + this.morning + this.afternoon)
    }

    displayNumber(num) {
        return Math.round((num + Number.EPSILON) * 100) / 100
    }

    handleStartLunch = (val) => {
        let newState = {lunchStart: val}
        if (val.add(1, 'minute').isAfter(this.state.lunchEnd)) {
            newState.lunchEnd = val.add(1, 'minute')
        }
        this.setState(newState)
        setTimeout(() => {
            this.adjustEnd(this.state.target)
        }, 0)
    }

    handleEndLunch = (val) => {
        this.setState({lunchEnd: val})
        setTimeout(() => {
            if (this.state.lock) {
                this.adjustEnd(this.state.target)
            } else {
                this.setState({target: this.total})
            }
        }, 0)
    }

    handleEnd = (val) => {
        this.setState({end: val})
        setTimeout(() => {
            const hourDiff = this.state.target - this.total
            if (this.state.lock) {
                this.setState({lunchEnd: this.state.lunchEnd.add(-hourDiff, 'hour')})
            } else {
                this.setState({target: this.total})
            }
        }, 0)
    }

    adjustEnd = (target) => {
        const hourDiff = target - this.total
        this.setState({end: this.state.end.add(hourDiff, 'hour')})
    }

    handleLock = () => {
        this.setState({lock: !this.state.lock})
    }

    render() {
        return (
            <FormControl>
                <List>
                    {
                        Object.entries(this.state.days).map(([key, val]) => {
                            return (
                                <ListItem>
                                    <FormLabel>{key}</FormLabel>
                                    <TextField
                                        label="Total Hours"
                                        type="number"
                                        value={val}
                                        onChange={(evt) => {
                                            this.setState({
                                                days: {...this.state.days, [key]: evt.target.value}
                                            })
                                            setTimeout(() => {this.adjustEnd(this.state.target)}, 0)
                                        }}
                                    />
                                </ListItem>
                            )
                        })
                    }
                    <ListItem>
                        <p><b>Friday</b></p>
                    </ListItem>
                    <ListItem>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                label="Clock In"
                                value={this.state.start}
                                onChange={(val) => {
                                    this.setState({start: val})
                                    setTimeout(() => {this.adjustEnd(this.state.target)}, 0)
                                }}
                            />
                        </LocalizationProvider>
                        <p>Morning hours: {this.displayNumber(this.morning)}</p>
                    </ListItem>
                    <ListItem>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                label="Lunch Start"
                                value={this.state.lunchStart}
                                onChange={this.handleStartLunch}
                            />
                        </LocalizationProvider>
                        -
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                label="Lunch End"
                                className="focus"
                                value={this.state.lunchEnd}
                                onChange={this.handleEndLunch}
                            />
                        </LocalizationProvider>
                        <p>Lunch (hours): {this.displayNumber(this.lunch)}</p>
                    </ListItem>
                    <ListItem>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                label="Clock Out"
                                className="focus"
                                value={this.state.end}
                                onChange={this.handleEnd}
                            />
                        </LocalizationProvider>
                        <p>Afternoon hours: {this.displayNumber(this.afternoon)}</p>
                    </ListItem>
                    <ListItem>
                        <TextField
                            label="Target Hours"
                            className="focus"
                            type="number"
                            value={this.state.target}
                            onChange={(evt) => {this.adjustEnd(evt.target.value); this.setState({target: evt.target.value})}}
                        />
                        <IconButton onClick={this.handleLock}>
                            {this.state.lock ? <LockIcon></LockIcon> : <LockOpenIcon></LockOpenIcon>}
                        </IconButton>
                    </ListItem>
                    <ListItem>
                        <p>
                            Total Hours: <b>{this.total}</b>
                        </p>
                    </ListItem>
                </List>
            </FormControl>
        )
    }
}