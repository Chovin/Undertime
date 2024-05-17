import { Component } from "preact";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { FormControl, FormLabel, IconButton, List, ListItem, TextField, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import dayjs from "dayjs";

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { ExpandMore } from "@mui/icons-material";

export default class Calculator extends Component {
    constructor() {
        super()
        let days = {
            'Mon': "8",
            'Tue': "8",
            'Wed': "8",
            'Thu': "8"
        }
        let day_details = {}
        let accordion_state = {}
        for (let day in days) {
            day_details[day] = {
                start: dayjs().hour(8).minute(0),
                lunchStart: dayjs().hour(12).minute(0),
                lunchEnd:  dayjs().hour(13).minute(0),
                end:  dayjs().hour(17).minute(0),
            }
            accordion_state[day] = false
        }
        this.state = {
            days: days,
            day_details,
            accordion_state,
            start: dayjs().hour(8).minute(0),
            lunchStart: dayjs().hour(12).minute(0),
            lunchEnd:  dayjs().hour(13).minute(0),
            end:  dayjs().hour(17).minute(0),
            target: 40,
            lock: true
        }
        this.day_detail_labels = {
            start: "Clock In",
            lunchStart: "Lunch Start",
            lunchEnd: "Lunch End",
            end: "Clock Out"
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
            this.relativeAdjust()
        }, 0)
    }

    relativeAdjust = (end) => {
        end = end || false
        const hourDiff = this.state.target - this.total
        if (this.state.lock) {
            if (end) {
                this.adjustEnd(this.state.target)
            } else {
                this.setState({lunchEnd: this.state.lunchEnd.add(-hourDiff, 'hour')})
            }
        } else {
            this.setState({target: this.total})
        }
    }

    adjustEnd = (target) => {
        const hourDiff = target - this.total
        this.setState({end: this.state.end.add(hourDiff, 'hour')})
    }

    handleLock = () => {
        this.setState({lock: !this.state.lock})
    }

    componentDidMount() {
        this.setState(JSON.parse(localStorage.getItem("sub_state")))
    }

    componentDidUpdate() {
        localStorage.setItem("sub_state", JSON.stringify(this.getLocalStorageState()))
    }

    getLocalStorageState = () => {
        return {
            lock: this.state.lock,
            accordion_state: this.state.accordion_state
        }
    }

    updateDayTotal(day) {
        let days = this.state.days
        days[day] = this.dayTotal(day)
        // console.log(days, day, morning + afternoon)
        this.setState({days})
    }

    dayTotal(day) {
        let details = this.state.day_details[day]
        let morning = details.lunchStart.diff(details.start, 'hour', true)
        let afternoon = details.end.diff(details.lunchEnd, 'hour', true)
        return morning + afternoon
    }


    render() {
        return (
            <FormControl>
                <List>
                    {
                        Object.entries(this.state.days).map(([key, val]) => {
                            return (
                                <Accordion expanded={this.state.accordion_state[key]}>
                                    <AccordionSummary expandIcon={
                                        <IconButton onClick={() => {
                                            let accordion_state = this.state.accordion_state
                                            accordion_state[key] = !accordion_state[key]
                                            this.setState({accordion_state})
                                        }}>
                                            <ExpandMore />
                                        </IconButton>
                                    }>
                                        <FormLabel>{key}</FormLabel>
                                        <TextField
                                            label="Total Hours"
                                            type="number"
                                            value={val}
                                            onChange={(evt) => {
                                                let day_details = this.state.day_details
                                                let old_total = this.dayTotal(key)
                                                let new_total = evt.target.value
                                                day_details[key].end = day_details[key].end.add(new_total-old_total,'hour')

                                                this.setState({
                                                    days: {...this.state.days, [key]: new_total},
                                                    day_details
                                                })


                                                setTimeout(() => {this.relativeAdjust(true)}, 0)
                                            }}
                                        />
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List>
                                            {
                                                Object.entries(this.state.day_details[key]).map(([day_part, part_val]) => {
                                                    return (
                                                        <ListItem>
                                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                <TimePicker
                                                                    label={this.day_detail_labels[day_part]}
                                                                    value={part_val}
                                                                    onChange={(val) => {
                                                                        let day_details = this.state.day_details
                                                                        day_details[key][day_part] = val
                                                                        this.setState({day_details})
                                                                        this.updateDayTotal(key)
                                                                        setTimeout(() => {this.relativeAdjust(true)}, 0)
                                                                    }}
                                                                />
                                                            </LocalizationProvider>
                                                        </ListItem>
                                                    )
                                                })
                                            }
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
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