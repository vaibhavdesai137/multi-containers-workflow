import React, { Component } from 'react';
import axios from 'axios';

class Fib extends Component {

  state = {
    fibRequests: [],
    fibResults: [],
    enteredIndex: ""
  };

  componentDidMount() {
    this.getFibRequests();
    this.getFibResults();
  }

  // Uses postgres
  async getFibRequests() {
    const response = await axios.get('/api/fibRequests');
    this.setState({ fibRequests: response.data });
  }

  // Uses redis
  async getFibResults() {
    const response = await axios.get('/api/fibResults');
    this.setState({ fibResults: response.data });
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    axios.post("/api/fibRequests", {
      index: this.state.enteredIndex
    });
    this.setState({enteredIndex: ""});
  }

  renderFibRequests() {
    return this.state.fibRequests.map(({index}) => index).join(", ");
  }

  renderFibResults() {
    const entries = [];
    for(let key in this.state.fibResults) {
      entries.push(
        <div key={key}>
          For index {key}, redis returned {this.state.fibResults[key]}
        </div>
      );
    }
    return entries;
  }

  render() {
    return (
      <div>
        
        <form onSubmit={this.handleSubmit}>
          <label>Enter the index for fibonacci calculation: </label>
          <input 
            value={this.state.enteredIndex}
            onChange={event => this.setState({enteredIndex: event.target.value})}
          />
          <button>Submit</button>
        </form>

        <h2>Indices requested so far (fetched from postgres): </h2>
        { this.renderFibRequests() }

        <h2>Indices calculated so far (fetched from redis): </h2>
        { this.renderFibResults() }

      </div>
    );

  }

}

export default Fib;
