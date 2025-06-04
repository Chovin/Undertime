import { Component } from "preact";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { FormControl, FormLabel, IconButton, List, ListItem, TextField, Accordion, AccordionSummary, AccordionDetails, Box } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
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
            'Thu': "8",
            "Fri": "8",
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
            target: 40,
            lock: true,
            track: {},
            prevState: JSON.stringify({target: 40, days, day_details})
        }
        this.day_detail_labels = {
            start: "Clock In",
            lunchStart: "Lunch Start",
            lunchEnd: "Lunch End",
            end: "Clock Out"
        }
    }

    get total() {
        const days = Object.values(this.state.days).map((v) => parseFloat(v) || 0).reduce((a,b) => a + b)
        return this.displayNumber(days)
    }

    displayNumber(num) {
        return Math.round((num + Number.EPSILON) * 100) / 100
    }

    relativeAdjust = () => {
        const hourDiff = this.state.target - this.total
        if (this.state.lock) {
            this.adjustEnd(this.state.target)
        } else {
            this.setState({target: this.total})
        }
    }

    adjustEnd = (target) => {
        // might not be needed anymore
        const hourDiff = target - this.total
        this.state.day_details['Fri'].end = this.state.day_details['Fri'].end.add(hourDiff, 'hour', true)
        this.updateDayTotal('Fri')
    }

    handleLock = () => {
        this.state.day_details['Fri']._locked = !this.state.lock
        this.setState({lock: !this.state.lock})
    }

    componentDidMount() {
        this.setState(JSON.parse(localStorage.getItem("sub_state")))
    }

    flashState = (path) => {
        let track = this.state.track
        if (track[path]) {
            clearTimeout(track[path])
        }
        track[path] = setTimeout(() => {
            track[path] = false
            this.setState({track})
        }, 1000)
        this.setState({track})
    }

    componentDidUpdate(prevProps, prevState) {
        let cs = {
            target: this.state.target, 
            days: this.state.days, 
            day_details: this.state.day_details
        }
        delete cs.prevState
        let currentState = JSON.stringify(cs)
        let oldState = this.state.prevState

        if (currentState == oldState) {
            return
        }
        prevState = JSON.parse(oldState)
        let newState = JSON.parse(currentState)
        if (prevState.target !== newState.target) {
            this.flashState("target")
        }
        for (let day in newState.days) {
            if (newState.days[day] != prevState.days[day]) {
                this.flashState(`days.${day}`)
            }
        }
        for (let day in newState.day_details) {
            for (let detail in newState.day_details[day]) {
                if (detail = "lunches") {
                    for (let i = 0; i < newState.day_details[day].lunches.length; i++) {
                        let lunches = newState.day_details[day].lunches
                        let plunches = prevState.day_details[day].lunches
                        if (plunches.length >= lunches.length) {
                            if (lunches[i].lunchStart != plunches[i].lunchStart) {
                                this.flashState(`day_details.${day}.${i}.lunchStart`)
                            }
                            if (lunches[i].lunchEnd != plunches[i].lunchEnd) {
                                this.flashState(`day_details.${day}.${i}.lunchEnd`)
                            }
                        }
                    }
                    continue
                } else if (newState.day_details[day][detail] != prevState.day_details[day][detail]) {
                    this.flashState(`day_details.${day}.${detail}`)
                }
            }
        }
        this.setState({prevState: currentState})

        localStorage.setItem("sub_state", JSON.stringify(this.getLocalStorageState()))
    }

    getLocalStorageState = () => {
        return {
            lock: this.state.lock,
            accordion_state: this.state.accordion_state
        }
    }

    updateDayTotal(day) {
        let days = {...this.state.days}
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
                                        <FormLabel>
                                            <Box className="hidden-text-width"
                                                style={{
                                                    "--content": `"${key}"`,
                                                }}
                                            >
                                                Wed
                                            </Box>
                                        </FormLabel>
                                        <TextField
                                            label="Total Hours"
                                            type="number"
                                            className={this.state.track[`days.${key}`] ? 'focus' : ''}
                                            disabled={this.state.lock && key == 'Fri'}
                                            value={val}
                                            onChange={(evt) => {
                                                let day_details = this.state.day_details
                                                let old_total = this.dayTotal(key)
                                                let new_total = evt.target.value
                                                day_details[key].end = day_details[key].end.add(new_total-old_total,'hour')
                                                this.flashState(`day_details.${key}.end`)

                                                this.setState({
                                                    days: {...this.state.days, [key]: new_total},
                                                    day_details
                                                })


                                                setTimeout(() => {this.relativeAdjust()}, 0)
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
                                                    if (day_part[0] == '_') {  // design debt. will fix later
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
                                                                                    className={this.state.track[`day_details.${key}.${index}.lunchStart`] ? 'focus' : ''}
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
                                                                                            setTimeout(() => {this.relativeAdjust()}, 0)
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="d-block"
                                                                                style={{padding: '8px 0px'}}
                                                                            >
                                                                                <TimePicker
                                                                                    className={this.state.track[`day_details.${key}.${index}.lunchEnd`] ? 'focus' : ''}
                                                                                    label={this.day_detail_labels['lunchEnd']}
                                                                                    value={lunch.lunchEnd}
                                                                                    onChange={(val) => {
                                                                                        let day_details = this.state.day_details
                                                                                        lunch.lunchEnd = val
                                                                                        if (lunch.lunchStart.isAfter(val) || lunch.lunchStart.isSame(val)) {
                                                                                            lunch.lunchStart = val.subtract(1, 'minute')
                                                                                        }
                                                                                        this.setState({day_details})
                                                                                        if (day_details[key]._locked) {
                                                                                            let hourDiff = this.state.days[key] - this.dayTotal(key)
                                                                                            day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                                        } else {
                                                                                            this.updateDayTotal(key)
                                                                                            setTimeout(() => {this.relativeAdjust()}, 0)
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
                                                                        <div style={{
                                                                            whiteSpace: 'nowrap',
                                                                        }}>
                                                                            - {this.displayNumber(lunch.lunchEnd.diff(lunch.lunchStart, 'hour', true)) + (useMediaQuery('(max-width: 768px)')? 'hr' : ' hours')}
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
                                                                                    setTimeout(() => {this.relativeAdjust()}, 0)
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
                                                                    className={this.state.track[`day_details.${key}.${day_part}`] ? 'focus' : ''}
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
                                                                                    last_lunch.lunchEnd = last_lunch.lunchEnd.add(-hourDiff, 'hour', true)
                                                                                } else {
                                                                                    day_details[key].start = day_details[key].start.add(hourDiff, 'hour', true)
                                                                                }
                                                                            } else {
                                                                                day_details[key].end = day_details[key].end.add(hourDiff, 'hour', true)
                                                                            }
                                                                        } else {
                                                                            this.updateDayTotal(key)
                                                                            setTimeout(() => {this.relativeAdjust()}, 0)
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
                                                                        setTimeout(() => {this.relativeAdjust()}, 0)
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
                        <p><b>Target Hours</b></p>
                    </ListItem>
                    <ListItem>
                        <TextField
                            className={this.state.track['target'] ? 'focus' : ''}
                            type="number"
                            value={this.state.target}
                            onChange={(evt) => {
                                let fri = this.state.day_details['Fri']
                                let target = parseFloat(evt.target.value) || 0
                                // this.adjustEnd(evt.target.value);
                                let hourDiff = target - this.total
                                fri.end = fri.end.add(hourDiff, 'hour', true)
                                this.setState({target: evt.target.value})

                                this.updateDayTotal('Fri')
                                setTimeout(() => {this.relativeAdjust()}, 0)
                            }}
                        />
                        <IconButton onClick={this.handleLock}>
                            {this.state.lock ? <LockIcon></LockIcon> : <LockOpenIcon></LockOpenIcon>}
                        </IconButton>
                    </ListItem>
                </List>
            </FormControl>
        )
    }
}