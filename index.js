import { allTeams } from "./allTeams.js"

let games = []
let chosenList = []
//let chosenWeek
let overallStatusArr = []

const weekPicker = document.getElementById("week")
const teamPicker = document.getElementById("team-picker")
const yourGames = document.getElementById("yourGames")
const statusDiv = document.getElementById("status-summary")
const refreshButtonCont = document.getElementById("refresh-scores-cont")

// In order, 0_Lost 1_losing-far 2_losing-close 3_winning-close 4_winning-far 5_Won
let gameStateClassArr = ["s-red", "s-redorange", "s-orange", "s-yellow", "s-yellowgreen", "s-green"]

function restoreSession(){
    let previouslyPickedWeek = 0
    let previouslyPickedTeams = 0
    if (localStorage.getItem("lastPickedWeek") && localStorage.getItem("lastPickedTeams")){
        previouslyPickedWeek = localStorage.getItem("lastPickedWeek")
        previouslyPickedTeams = JSON.parse(localStorage.getItem("lastPickedTeams"))
        document.getElementById("yourPicks").classList.add("hidden")
        refreshButtonCont.classList.remove("hidden")
        grabGames(previouslyPickedWeek, previouslyPickedTeams)
    }
}

restoreSession()

function fillTeams(){
   let myStr = "<p>2. Select your picks to win</p>"
   for (let i=0; i < allTeams.length; i++){
    if (allTeams[i].teamName != "empty"){
        myStr += `
            <input type="checkbox" id="comp${i}" name="comps" value="${allTeams[i].teamId}"></input>
            <label for="comp${i}">${allTeams[i].teamName}</label><br/>
        `
    }
   }
   teamPicker.innerHTML = myStr
}

document.getElementById('sub-picks').addEventListener("click", function(e){
    e.preventDefault()
    chosenList =[]
    let markedBox = document.getElementsByName('comps')
    for (let checkbox of markedBox){
        if(checkbox.checked){chosenList.push(checkbox.value)}
    }
    localStorage.setItem("lastPickedWeek", weekPicker.value)
    localStorage.setItem("lastPickedTeams", JSON.stringify(chosenList))
    document.getElementById("yourPicks").classList.add("hidden")
    refreshButtonCont.classList.remove("hidden")
    grabGames(weekPicker.value, chosenList)
})

document.getElementById('refresh-scores').addEventListener("click", function(){
    grabGames(localStorage.getItem("lastPickedWeek"),JSON.parse(localStorage.getItem("lastPickedTeams")))
})

document.getElementById('clear-picks').addEventListener("click", function(){
    localStorage.clear()
    location.reload()
})

function grabGames(week,teams){
    let myURL = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2023&seasontype=2&week=${week}`
    fetch(myURL)
        .then(res => res.json())
        .then(data => {
            games = []

            const events = data.events
            for (let i=0; i < events.length; i++){
                if(teams.includes(events[i].competitions[0].competitors[0].team.id) || teams.includes(events[i].competitions[0].competitors[1].team.id)){
                    let myChosenTeam = (teams.includes(events[i].competitions[0].competitors[0].team.id)) ? events[i].competitions[0].competitors[0].team.id : events[i].competitions[0].competitors[1].team.id
                    let team1arr = [events[i].competitions[0].competitors[0].team.id,
                                    events[i].competitions[0].competitors[0].team.name,
                                    events[i].competitions[0].competitors[0].team.color,
                                    events[i].competitions[0].competitors[0].team.alternateColor,
                                    events[i].competitions[0].competitors[0].team.logo,
                                    events[i].competitions[0].competitors[0].score,
                                    events[i].competitions[0].competitors[0].winner]
                    let team2arr = [events[i].competitions[0].competitors[1].team.id,
                                    events[i].competitions[0].competitors[1].team.name,
                                    events[i].competitions[0].competitors[1].team.color,
                                    events[i].competitions[0].competitors[1].team.alternateColor,
                                    events[i].competitions[0].competitors[1].team.logo,
                                    events[i].competitions[0].competitors[1].score,
                                    events[i].competitions[0].competitors[1].winner]
                    let chosenTeamArr = (team1arr[0] === myChosenTeam) ? team1arr : team2arr
                    let otherTeamArr = (team1arr[0] != myChosenTeam) ? team1arr : team2arr
                    let myBetStateF = (events[i].competitions[0].status.type.completed && chosenTeamArr[6]) ? 5 : (events[i].competitions[0].status.type.completed) ? 0 : "tbd"
                    let scoreDiff = chosenTeamArr[5] - otherTeamArr[5]
                    let myBetState = (scoreDiff >= 0) ? "winning" : "losing"
                    let gameState = (!events[i].competitions[0].status.type.completed && Math.abs(scoreDiff) < 9) ? "close" : "far"
                    let combinedState = (myBetStateF != "tbd") ? myBetStateF : (myBetState === "winning" && gameState === "close") ? 3 : (myBetState === "winning") ? 4 : (myBetState === "losing" && gameState === "close") ? 2 : 1
                    games.push({
                        team1: team1arr,
                        team2: team2arr,
                        completed: events[i].competitions[0].status.type.completed,
                        displayClock: events[i].competitions[0].status.displayClock,
                        period: events[i].competitions[0].status.period,
                        chosenTeam: myChosenTeam,
                        combinedState: combinedState,
                        betStateClass: gameStateClassArr[combinedState]
                    })
                }
            }
            console.log(games)
            renderGames()
        })
}

function renderGames(){
    let gameStr =''
    let detailsStr =''
    let team1class =''
    let team2class =''
    let statusStr = ''
    overallStatusArr = []

    for (let game of games){
        
        overallStatusArr.push(game.combinedState)

        if(game.completed){
            detailsStr = `<span class="final">FINAL</span>`
        } else {
            detailsStr = `<span class="clock">${game.displayClock}</span>
                        <span class="period">${game.period}</span>`
        }

        if (game.team1[0] === game.chosenTeam){
            team1class = "team1 chosen-team"
            team2class = "team2"
        }
        else if (game.team2[0] === game.chosenTeam){
            team2class = "team2 chosen-team"
            team1class = "team1"
        }

        gameStr += `
             <div class="game">
                <div class="${team1class}" style="background-color:${game.team1[2]};color:${game.team1[3]};">
                    <div class="teamIDout">
                        <div class="team1logo"><img src="${game.team1[4]}"/></div>
                        <span class="team1name">${game.team1[1]}</span>
                    </div>
                    <div class="score-out"><span class="score1">${game.team1[5]}</span></div>
                </div>
                <div class="${team2class}" style="background-color:${game.team2[2]};color:${game.team2[3]};">
                        <div class="score-out"><span class="score2">${game.team2[5]}</span></div>
                        <div class="teamIDout">
                            <span class="team2name">${game.team2[1]}</span>
                            <div class="team2logo"><img src="${game.team2[4]}"/></div>
                        </div>
                </div>
                <div class="details">
                    ${detailsStr}
                </div>
                <div class="tracking ${game.betStateClass}"></div>
             </div>
            `
    }
    yourGames.innerHTML = gameStr
    
    const transformedStatusArray = [0,0,0,0,0,0]

    for(let status of overallStatusArr){
        if (status === 0){
            transformedStatusArray[0] ++
        }
        if (status === 1){
            transformedStatusArray[1] ++
        }
        if (status === 2){
            transformedStatusArray[2] ++
        }
        if (status === 3){
            transformedStatusArray[3] ++
        }
        if (status === 4){
            transformedStatusArray[4] ++
        }
        if (status === 5){
            transformedStatusArray[5] ++
        }
    }

    if (transformedStatusArray[0]){statusStr += `<span class="sp-red">You have lost ${transformedStatusArray[0]} games</span><br/>`}
    if (transformedStatusArray[1]){statusStr += `<span class="sp-redorange">You are losing ${transformedStatusArray[1]} games by more than one score</span><br/>`}
    if (transformedStatusArray[2]){statusStr += `<span class="sp-orange">You are losing ${transformedStatusArray[2]} games by less than one score</span><br/>`}
    if (transformedStatusArray[3]){statusStr += `<span class="sp-yellow">You are tied or winning ${transformedStatusArray[3]} games by less than one score</span><br/>`}
    if (transformedStatusArray[4]){statusStr += `<span class="sp-yellowgreen">You are winning ${transformedStatusArray[4]} games by more than one score</span><br/>`}
    if (transformedStatusArray[5]){statusStr += `<span class="sp-green">You have won ${transformedStatusArray[5]} games</span><br/>`}

    statusDiv.innerHTML = statusStr
}

fillTeams()