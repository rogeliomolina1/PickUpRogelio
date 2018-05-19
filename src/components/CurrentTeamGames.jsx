import React from 'react';
import '../css/App.css';
var {Link}=require('react-router-dom');
import NavBar from "./NavBar"
import axios from 'axios';

const GUEST = "guest";

export class CurrentTeamGames extends React.Component{



    constructor(props) {
        super(props);
        this.state = {
            game: {},
            isprivate:false
        };
        this.playerteams=[];
        this.addGame = this.addGame.bind(this);
        this.togglePrivate=this.togglePrivate.bind(this);
    }
    componentDidMount() {
           let input = document.getElementById('location');
           this.autocomplete = new google.maps.places.Autocomplete(input);
    }
    componentWillMount(){
      axios({
        method:"post",
        url:"/retrieveplayerteams",
        data:{
          user:localStorage.getItem("user")
        }
      }).then((res)=>{
        this.playerteams=res.data;
        console.log(this.playerteams);
      })
    }



    getName()
    {
        if (this.props.user != GUEST)
        {
            return this.props.user;
        }
        else
        {
            return this.refs.name.value;
        }
    }

    getName()
    {
        if (this.props.user != GUEST)
        {
            return this.props.user;
        }
        else
        {
            return this.refs.name.value;
        }
    }

    addGame(event) {
        event.preventDefault();
        let sport = this.refs.sport.value;
        let name = this.getName();
        let location = this.refs.location.value;
        let isprivate = this.state.isprivate;
        let coords = this.autocomplete.getPlace().geometry.location;
        let id = Math.floor((Math.random()*(1 << 30))+1);
        let game = {
            gameId: id,
            sport: sport,
            name: name,
            isprivate:isprivate,
            location: location,
            user: localStorage.getItem("user"),
            coords: {
                lat: coords.lat(),
                lng: coords.lng()
            },
        };
        console.log(game);
        axios.post('/postgamesT', game).then( () =>
                {alert("Game added. It will appear upon refreshing the games table")});
        this.refs.sport.value='';
        this.refs.name.value='';
        this.refs.location.value='';
    }
    togglePrivate(){
      if(this.state.isprivate==false){
        this.setState({
          isprivate:true
        })
      }
      else{
        this.setState({
          isprivate:false
        });
      }
    }


    displayNameInput()
    {
        if (this.props.user != GUEST)
        {
            return null;
        }
        else
        {
            return (
                <input
                className='gameDetails'
                type="text"
                ref="name"
                placeholder="Name"
                />

            );
        }
    }

    render(){

        return(
            <div>
                <NavBar/>
                <form
                className="form-inline"
                onSubmit={this.addGame.bind(this)}
                >
                    {this.displayNameInput()}
                    <input
                    className='gameDetails'
                    type="text"
                    ref="sport"
                    placeholder="Activity"/>
                    <input
                    className='gameDetails'
                    id= 'location'
                    type="text"
                    ref="location"
                    placeholder="Location"/>
                    <p>Private</p>
                    <input
                      className='gameDetails'
                      id= 'isprivate'
                     type="checkbox"
                     ref="isprivate"
                     onChange={this.togglePrivate}/>

                    <div className="App-submitButton">
                        <input type="submit" value="Submit"/>
                    </div>
                </form>


                <h1 className="App-currentGames">
                Below are the currently available games:
                </h1>
            <GameTable user={this.props.user} />
            </div>
        );

    }
}

class GameTable extends React.Component{

  constructor(props)
  {
    super(props);
  	this.state =
  	{
        games: [],
  	  filteredGames: [],
      userTeams:[],
        retrieving: false,
  	}
    this.userTeams=this.userTeams.bind(this);
  }

  componentDidMount()
  {
    this.retrieveGames();
    this.userTeams();
  }
  userTeams(){

  }

    updateSearch(event){
      this.updateTable(event.target.value);
    }

    updateTable(search) {
        this.setState({filteredGames : this.state.games.filter(
            (game) => { return ((game.sport.toLowerCase().indexOf(search.toLowerCase()) !== -1)||
            (game.name.toLowerCase().indexOf(search.toLowerCase())!== -1)||
            (game.location.toLowerCase().indexOf(search.toLowerCase()) !== -1));
            })
        });
    }

    retrieveGames() {
        this.setState({retrieving: true});
        axios.post('/retrievegamesT').then((results)=>{
           let data = results.data.filter(game=>{
                return !game.isprivate
            });
            this.setState({games: data, retrieving: false});
            this.updateTable(this.refs.search.value);


        });


    }


  render() {
    if (this.state.retrieving == true)
    {
        return (<h2 className="retrieving">Retrieving Games...</h2>);
    }
    else return (
      <div>
        <input className = "searchBox"
        type="text" placeholder="Search"
		ref="search"
        onChange={this.updateSearch.bind(this)}/>


        <input type="button" value="Refresh" onClick={this.retrieveGames.bind(this)} />
	   <table>
	   <thead>
       <tr>
	  <th><h3>Activity</h3></th>
	  <th><h3>Name</h3></th>
	  <th><h3>Location</h3></th>
	  <th><h3>Join</h3></th>
	</tr>
      </thead>
      <tbody>
	      {
            this.state.filteredGames.map((game)=>{
                return (<Game userGames={this.props.userGames} game = {game} user={this.props.user} key={game.id} />);
            })
         }
	  </tbody>
      </table>
      </div>
	);

  }

}

class Game extends React.Component {
  constructor(props){
    super(props);
    this.showTeamGames=this.showTeamGames.bind(this);
  }
  joinGame()
  {
    axios.post('/joinT', {uid:this.props.user, gid:this.props.game.id});
  }
  leaveGame(){
    axios.patch('/gamesT', {uid:this.props.user, gid:this.props.game.id});
  }
  showTeamGames(){

  }

  render(){
    return(
        <tr>
          <td ><h3>{this.props.game.sport} </h3></td>
          <td ><h3>{this.props.game.name} </h3></td>
          <td > <h3>{this.props.game.location}</h3> </td>
          <td><button className="joinGame" onClick={this.joinGame.bind(this)}><h3>Join</h3></button></td>
          <td>
            <button className="leaveGame" onClick={this.leaveGame.bind(this)}><h3>Leave</h3></button>
            <div>
              {this.showTeamGames()}
            </div>
          </td>
          <td > <h3>{this.props.game.players.length}</h3> </td>
          <td><Link to={"/tgame:"+this.props.game.id}><h3>Details</h3></Link></td>
        </tr>
    );
  }
}
module.exports={
  CurrentTeamGames
}
