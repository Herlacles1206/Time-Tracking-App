import React, { Component } from 'react';
import {
  Button, TextField, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  TableContainer, TableHead, TableRow, TableCell
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import swal from 'sweetalert';
import { withRouter } from './utils';
import { blue } from 'material-ui/colors';
import HSBar from "react-horizontal-stacked-bar-chart";
import dayjs from 'dayjs';
const axios = require('axios');

class TrackDashboard extends Component {
  constructor() {
    super();
    this.state = {
      token: '',
      openModal: false,
      id: '',
      email: '',
      username: '',
      loading: false,
      fromDate: new Date(),
      toDate: new Date()  
    };
  }
  componentDidMount = () => {
    let token = localStorage.getItem('token');
    if (!token) {
      // this.props.history.push('/login');
      this.props.navigate("/login");
    } else {
      this.setState({ token: token }, () => {
        this.getUser();
      });
    }
  }
  setDateValue = (newValue, dir) => {
    if (dir === true)
      this.setState({ toDate: newValue },()=>{console.log(this.state);});
    else
      this.setState({ fromDate: newValue },()=>{console.log(this.state);});
  }
  getUser = () => {
    
    this.setState({ loading: true });

    let data = '?';
    data = `${data}page=${this.state.page}`;
    if (this.state.search) {
      data = `${data}&search=${this.state.search}`;
    }
    axios.get(`http://localhost:2000/get-user${data}`, {
      headers: {
        'token': this.state.token
      }
    }).then((res) => {
      this.setState({ loading: false, users: res.data.users, pages: res.data.pages });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        type: "error"
      });
      this.setState({ loading: false, users: [], pages: 0 },()=>{});
    });
  }

  logOut = () => {
    localStorage.setItem('token', null);
    // this.props.history.push('/');
    this.props.navigate("/");
  }

  onChange = (e) => {
    this.setState({ [e.target.name]: e.target.value }, () => { });
    if (e.target.name == 'search') {
      this.setState({ page: 1 }, () => {
        this.getUser();
      });
    }
  };

  addUser = () => {
    axios.post('http://localhost:2000/add-user', {
        username: this.state.username,
        email: this.state.email,
        password: this.state.password,
        confirm_password: this.state.confirm_password
      }, {
        headers: {
          'token': this.state.token
      }
    }).then((res) => {

      swal({
        text: res.data.title,
        icon: "success",
        type: "success"
      });

      this.handleUserClose();
      this.setState({ email: '', username: '', password: '', confirm_password: '', file: null, page: 1 }, () => {
        this.getUser();
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        type: "error"
      });
      this.handleUserClose();
    });
  }

  handleInfoOpen = () => {
    this.setState({
      openModal: true,
      id: '',
      username: '',
      email: '',
    });
  };

  handleInfoClose = () => {
    this.setState({ openModal: false });
  };

  render() {
    const timelineData = [];
    // Using a for loop to cycle from 0 to 24
    for (let i = 0; i <= 23; i++) {
        timelineData.push({
            value: 1,
            color: "red",
            description: `${String(i).padStart(2, '0')}:00`
        })
    }
    return (
      <div>
        {this.state.loading && <LinearProgress size={40} />}
        <div>
          <h2>Time Tracking Dashboard</h2>
          <Button
            className="button_style"
            variant="contained"
            size="small"
            onClick={this.logOut}
          >
            Log Out
          </Button>
        </div>
        <br />
        {/* View Interval */}
        <Dialog
          open={this.state.openUserEditModal}
          onClose={this.handleUserClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Edit User</DialogTitle>
          <DialogContent>
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="username"
              value={this.state.username}
              placeholder="User Name"
              required
            /><br />
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="email"
              value={this.state.email}
              placeholder="Email"
              required
            /><br />
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="password"
              value={this.state.password}
              placeholder="Password"
              required
            /><br />
          </DialogContent>

          <DialogActions>
            
          </DialogActions>
        </Dialog>

        <br />
        <div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From"
              name="fromDate"
              value={dayjs(this.state.fromDate)}
              // onChange={this.onChange}
              onChange={(newValue) => this.setDateValue(newValue, false)}
            />
            <DatePicker
              label="To"
              name="toDate"
              value={dayjs(this.state.toDate)}
              // onChange={this.onChange}
              onChange={(newValue) => this.setDateValue(newValue, true)}
            />
          </LocalizationProvider>
        </div>
        <br />
        <TableContainer enablePinning>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center" style={{ zIndex: 1, position: 'sticky', left: 0, backgroundColor: "#ddd", width: '50px' }}>Date</TableCell>
                <TableCell align="center" stype={{width: '50px', }}>Time</TableCell>
                <TableCell align="center" style={{ zIndex: 1, position: 'sticky', left: 0, backgroundColor: "#ddd", }}>
                    <HSBar height={0} showTextUp data={timelineData}></HSBar>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                <TableRow key={10/27}>
                  <TableCell align="center" component="th" scope="row" style={{ zIndex: 1, position: 'sticky', left: 0, backgroundColor: "#ddd", }}>
                    10/27
                  </TableCell>
                  <TableCell align="center" component="th" scope="row">
                    09:50h
                  </TableCell>
                  <TableCell>
                    <HSBar data={[{value: 10}, {value: 10}, {value: 50}, {value: 170}]} onClick={e => console.log(e.bar)}></HSBar>
                  </TableCell>
                </TableRow>
                <TableRow key={10/26}>
                  <TableCell align="center" component="th" scope="row" style={{ zIndex: 1, position: 'sticky', left: 0, backgroundColor: "#ddd", }}>
                    10/26
                  </TableCell>
                  <TableCell align="center" component="th" scope="row">
                    07:30h
                  </TableCell>
                  <TableCell>
                    <HSBar data={[{value: 40}, {value: 40}, {value: 20}]}></HSBar>
                  </TableCell>
                </TableRow>
            </TableBody>
          </Table>
          <br />
        </TableContainer>
      </div>
    );
  }
}

export default withRouter(TrackDashboard);