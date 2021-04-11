function deg(lat1, lat2, lon1, lon2){ //https://movable-type.co.uk/scripts/latlong.html
	const a1 = lat1 * Math.PI/180;
	const a2 = lat2 * Math.PI/180;
	const o1 = lon1 * Math.PI/180;
	const o2 = lon2 * Math.PI/180;

	const y = Math.sin(o2-o1) * Math.cos(a2);
	const x = Math.cos(a1)*Math.sin(a2) -
    Math.sin(a1)*Math.cos(a2)*Math.cos(o2-o1);
	const t = Math.atan2(y, x);
	const bearing = (t*180/Math.PI + 360) % 360; // in degrees
	return Math.round(bearing)
}

async function plot(){
	var which = document.querySelector('#airselect').value.toUpperCase()
	var dat = await d3.json("https://geodata.md.gov/imap/rest/services/Transportation/MD_Transit/FeatureServer/19/query?where=1%3D1&outFields=*&outSR=4326&f=json")
	dat.features.forEach((ele, i) =>{
		ele.bearing = deg(ele.attributes.BaseLat, ele.attributes.RecLat, ele.attributes.BaseLong, ele.attributes.RecLong)
		if(ele.bearing == 0){ele.bearing = 360}
	})

	// var how = function(){

		
	// 	//console.log((-((d3.mouse(this)[0]-(this.width.animVal.value/2)+10)/(d3.mouse(this)[1]-(this.width.animVal.value/2)+10))*180)/Math.PI)
	// 	a = Math.abs(d3.mouse(this)[0]-(this.width.animVal.value/2)+10)
	// 	b = Math.abs(d3.mouse(this)[1]-(this.width.animVal.value/2)+10)
	// 	c = Math.sqrt((a^2) + (b^2))
	// 	console.log(c)
	// 	//console.log((b^2+c^2-a^2)/(2*b*c))
	// 	console.log(d3.mouse(this)[0])
	// 	console.log(d3.mouse(this)[1])

	// 	console.log(Math.acos((b^2+c^2-a^2)/(2*b*c))*180/Math.PI)

	// }
	var dot = []
	var temp = []
	var seldot = []
	var tomp = []
	for (i = 1; i<=360; i++){

		var entry = {deg: i, len: 0}
		var entro = {deg: i, len: 0}
		dat.features.forEach(ele => {
			if (i == ele.bearing){
				entry.len = entry.len + parseFloat(ele.attributes.Length)
				if (which == ele.attributes.LOCID){
					entro.len = entro.len + parseFloat(ele.attributes.Length)
				}
			}

		})

		dot.push(entry)
		seldot.push(entro)
		temp.push({deg: i, len: 0})
		tomp.push({deg: i, len: 0})


	}
	dot.forEach((ele, i, arr) => {
		var go;
		if (i+1 <= 180){go=i+180}
		else{go=i-180}
		temp[i].len = temp[i].len + ele.len
		temp[go].len = temp[go].len + ele.len
	})
	seldot.forEach((ele, i, arr) => {
		var go;
		if (i+1 <= 180){go=i+180}
		else{go=i-180}
		tomp[i].len = tomp[i].len + ele.len
		tomp[go].len = tomp[go].len + ele.len
	})


	dot = temp
	seldot = tomp

	var size = Math.min(0.75*screen.height, 0.75*screen.width)
	var margin = {top: 10, right: 10, bottom: 10, left: 10},
    		width = size - margin.left - margin.right,
    		height = size - margin.top - margin.bottom,
    		innerRadius = 10,
    		outerRadius = Math.min(width, height) / 2;
    d3.selectAll("svg").remove()

	var svg = d3.select("#plot")
  		.append("svg")
  			// .on("click", how)
        	.attr("preserveAspectRatio", "xMinYMin meet")
        	.attr("viewBox", "0 0 " + size +" " + size)
  		.append("g")
  			.attr("id", "datplot")
    		.attr("transform", "translate(" + width / 2 + "," + ( height/2)+ ")");

	var x = d3.scaleBand()
    	.range([0, 2*Math.PI])
    	.domain( dot.map(function(d) {return d.deg;}));

	var y = d3.scaleLinear()
    	.range([innerRadius, outerRadius])
    	.domain([0, 22000]);

    var ticks = [0,5000,10000,15000,20000];

	ticks.forEach(ele => 
		svg.append("circle")
    		.attr("cx", 0)
    		.attr("cy", 0)
    		.attr("fill", "none")
    		.attr("stroke", "gray")
    		.attr("r", y(ele))
	);

	ticks.forEach(ele =>
		svg.append("text")
    		.attr("x", 5)
    		.attr("y", -5 - y(ele))
    		.style("font-size", "8px")
    		.text(ele.toString() + "ft")
		)
	svg.append("line")
		.attr("x1", y(20000))
		.attr("x2", y(-20000)-2*innerRadius)
		.attr("y1", 0)
		.attr("y2", 0)
		.attr("stroke","gray");
	svg.append("line")
		.attr("x1", 0)
		.attr("x2", 0)
		.attr("y1", y(20000))
		.attr("y2", y(-20000)-2*innerRadius)
		.attr("stroke","gray");
  	svg.append("g")
		.selectAll("path")
    	.data(dot)
    	.enter()
    	.append("path")
    		.attr("d", d3.arc() 
        	.innerRadius(innerRadius)
        	.outerRadius(function(d) { return y(d.len); })
        	.startAngle(function(d) { return x(d.deg); })
        	.endAngle(function(d) { return x(d.deg) + x.bandwidth(); })
        	.padAngle(0.01)
        	.padRadius(innerRadius))
    if (which == "ALL AIRPORTS" || which == ""){
   		d3.selectAll("path").attr("fill", "#fc805a")
   	}
   	else{
   		d3.selectAll("path").attr("fill", "grey")
   		svg.append("g")
		.selectAll("path")
    	.data(seldot)
    	.enter()
    	.append("path")
    		.attr("fill", "#fc805a")
    		.attr("d", d3.arc() 
        	.innerRadius(innerRadius)
        	.outerRadius(function(d) { return y(d.len); })
        	.startAngle(function(d) { return x(d.deg); })
        	.endAngle(function(d) { return x(d.deg) + x.bandwidth(); })
        	.padAngle(0)
        	.padRadius(innerRadius))
        	.transition()
        	.duration(10000)
   	}



}

function selectairport(){
	var select = document.getElementById("airselect")
	var list = document.createElement('Datalist')
		list.setAttribute("id", "airports")
		list.setAttribute("width", "500px")
	d3.json('https://geodata.md.gov/imap/rest/services/Transportation/MD_Transit/FeatureServer/19/query?where=1%3D1&outFields=*&outSR=4326&f=json').then((air) => {
        var ids = [... new Set(air.features.map((d) => {return d.attributes.LOCID}))]
        var names = [... new Set(air.features.map((d) => {return d.attributes.FULLNAME}))]
        names.forEach((ele, i) => {
			var option = document.createElement('option')
		    option.value = ids[i]
		    option.textContent= ids[i] + " - " + ele
		    list.appendChild(option)
	})
        var option = document.createElement('option')
        option.value = "All Airports"
        option.textContent= "All Airports"
        list.appendChild(option)
	})
	select.setAttribute('list', 'airports')
	select.appendChild(list)
}

window.addEventListener('load', function () {

	document.querySelector('#airselect').value = "All Airports"
	selectairport()
	plot()


})