import { Component } from "preact";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { FormControl, FormLabel, IconButton, List, ListItem, TextField, Accordion, AccordionSummary, AccordionDetails, Box } from "@mui/material";
import dayjs from "dayjs";

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
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
                lunches: [
                    {lunchStart: dayjs().hour(12).minute(0), lunchEnd: dayjs().hour(13).minute(0)}
                ],
                end:  dayjs().hour(17).minute(0),
                _locked: false
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
        if (details.lunches.length == 0) {
            return details.end.diff(details.start, 'hour', true)
        }
        let pairs = [[details.start, details.lunches[0].lunchStart], 
                     [details.lunches[details.lunches.length-1].lunchEnd, details.end]]
        for (let i = 0; i < details.lunches.length-1; i++) {
            let fh = details.lunches[i].lunchEnd
            let lh = details.lunches[i+1].lunchStart
            pairs.push([fh, lh])
        }
        let acc = 0;
        for (let [a, b] of pairs) {
            acc += b.diff(a, 'hour', true)
        }
        return acc
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
                                        <Box display="flex" alignItems="center" gap={1}> 
                                            {/* oh, I'm using preact/mui, thought I was using Vue/Vuetify */}
                                            <IconButton
                                                onClick={() => {
                                                    let day_details = this.state.day_details
                                                    day_details[key]._locked = !day_details[key]._locked
                                                    this.setState({day_details})
                                                }}>
                                                {this.state.day_details[key]._locked ? <LockIcon/> : <LockOpenIcon/>}
                                            </IconButton>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List>
                                            {
                                                Object.entries(this.state.day_details[key]).map(([day_part, part_val]) => {
                                                    if (day_part == "_locked") {  // design debt. will fix later
                                                        return
                                                    }
                                                    if (day_part == "lunches") {
                                                        return part_val.map((lunch, index) => {
                                                            return (
                                                                <ListItem key={`${key}-${index}`}
                                                                    class="d-flex justify-content-between align-items-center"
                                                                >
                                                                    <div>
                                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                            <div className="d-block"
                                                                                style={{padding: '8px 0px'}}
                                                                            >
                                                                                <TimePicker
                                                                                    label={this.day_detail_labels['lunchStart']}
                                                                                    value={lunch.lunchStart}
                                                                                    onChange={(val) => {
                                                                                        let day_details = this.state.day_details
                                                                                        lunch.lunchStart = val
                                                                                        if (lunch.lunchEnd.isBefore(val) || lunch.lunchEnd.isSame(val)) {
                                                                                            lunch.lunchEnd = val.add(1, 'minute')
                                                                                        }
                                                                                        this.setState({day_details})
                                                                                        if (day_details[key]._locked) {
                                                                                            let hourDiff = this.state.days[key] - this.dayTotal(key)
                                                                                            day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                                        } else {
                                                                                            this.updateDayTotal(key)
                                                                                            setTimeout(() => {this.relativeAdjust(true)}, 0)
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="d-block"
                                                                                style={{padding: '8px 0px'}}
                                                                            >
                                                                                <TimePicker
                                                                                    label={this.day_detail_labels['lunchEnd']}
                                                                                    value={lunch.lunchEnd}
                                                                                    onChange={(val) => {
                                                                                        let day_details = this.state.day_details
                                                                                        lunch.lunchEnd = val
                                                                                        if (lunch.lunchEnd.isBefore(val) || lunch.lunchEnd.isSame(val)) {
                                                                                            lunch.lunchStart = val.subtract(1, 'minute')
                                                                                        }
                                                                                        this.setState({day_details})
                                                                                        if (day_details[key]._locked) {
                                                                                            let hourDiff = this.state.days[key] - this.dayTotal(key)
                                                                                            day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                                        } else {
                                                                                            this.updateDayTotal(key)
                                                                                            setTimeout(() => {this.relativeAdjust(true)}, 0)
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </LocalizationProvider>
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                border: '1px solid #bbb',
                                                                                borderLeft: 'none',
                                                                                borderTopRightRadius: '1rem',
                                                                                borderBottomRightRadius: '1rem',
                                                                                height: '5rem',
                                                                                width: '.5rem'
                                                                            }}
                                                                        >
                                                                        </div>
                                                                        <div>
                                                                            - {lunch.lunchEnd.diff(lunch.lunchStart, 'hour', true)} hours
                                                                        </div>
                                                                        <IconButton
                                                                            onClick={() => {
                                                                                let day_details = this.state.day_details
                                                                                day_details[key].lunches.splice(index, 1)
                                                                                this.setState({day_details})
                                                                                if (day_details[key]._locked) {
                                                                                    let hourDiff = this.state.days[key] - this.dayTotal(key)
                                                                                    day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                                } else {
                                                                                    this.updateDayTotal(key)
                                                                                    setTimeout(() => {this.relativeAdjust(true)}, 0)
                                                                                }
                                                                            }}
                                                                            style={{marginLeft: '8px'}}
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </div>
                                                                </ListItem>

                                                            )
                                                        })
                                                    }
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
                                                                        let hourDiff = this.state.days[key] - this.dayTotal(key)
                                                                        if (day_details[key]._locked) {
                                                                            if (day_part == "end") {
                                                                                let nlunches = day_details[key].lunches.length
                                                                                if (nlunches > 0) {
                                                                                    let last_lunch = day_details[key].lunches[nlunches-1]
                                                                                    last_lunch.lunchEnd = last_lunch.lunchEnd.add(hourDiff, 'hour', true)
                                                                                } else {
                                                                                    day_details[key].start = day_details[key].start.add(hourDiff, 'hour', true)
                                                                                }
                                                                            } else {
                                                                                day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                            }
                                                                        } else {
                                                                            this.updateDayTotal(key)
                                                                            setTimeout(() => {this.relativeAdjust(true)}, 0)
                                                                        }
                                                                    }}
                                                                />
                                                            </LocalizationProvider>
                                                            {day_part == "end" && <IconButton
                                                                onClick={() => {
                                                                    let day_details = this.state.day_details
                                                                    let nextHour = 12
                                                                    let len = day_details[key].lunches.length
                                                                    if (len > 0) {
                                                                        nextHour = day_details[key].lunches[len-1].lunchEnd.hour() + 1
                                                                    }
                                                                    day_details[key].lunches.push({
                                                                        lunchStart: dayjs().hour(nextHour).minute(0),
                                                                        lunchEnd: dayjs().hour(nextHour+1).minute(0)
                                                                    })
                                                                    this.setState({day_details})
                                                                    if (day_details[key]._locked) {
                                                                        let hourDiff = this.state.days[key] - this.dayTotal(key)
                                                                        day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                    } else {
                                                                        this.updateDayTotal(key)
                                                                        setTimeout(() => {this.relativeAdjust(true)}, 0)
                                                                    }
                                                                }}
                                                            >
                                                                <AddCircleIcon/>
                                                            </IconButton>}
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