﻿/// <reference path='_references.ts' />

module App
{
	class ChartConfig
	{
		public width:number;
		public height:number;
		public innerRadius;
		
		constructor(
			public semiCircleRadius:number,
			public semiCircleWidth:number,
			public settingWidth:number,
			public colours: string[]
		){
			this.width = 2 * semiCircleRadius + 2 * semiCircleWidth;
			this.height = semiCircleRadius * 1.5 + semiCircleWidth;
			this.innerRadius = semiCircleRadius - semiCircleWidth;	
		}
		
		static Standard = new ChartConfig(400, 25, 30,
			[//"black", "silver", "gray", "white",
			"maroon", "red", "purple", "fuchsia",
			"green", "lime", "olive", "yellow"]
			);
	}
	
	export class Skills
	{
		static go(){            
            var divSvg = d3.select("#skills_svg");
			divSvg.select("svg").remove();
			
            var config = ChartConfig.Standard;
						
            var svg = divSvg.append("svg")
				.attr("width", config.width)
				.attr("height", config.height);
			
			var cvData = CV.CVData.getData();
			
			var idAndActiveSorter = new IdAndActiveSorter(cvData);
			
			var colours = new App.Colours(cvData, new ColourRandomiser(config.colours));
						
			var lengthScaler = new App.LengthScaler(cvData);
			
			var moveToMiddle = "translate(" + config.width / 2 + "," + (config.semiCircleRadius + config.semiCircleWidth) + ")"
			
			// Settings
			
			var settingsScaled = lengthScaler.getSettings();
			
			var moveToLeftHandSideOfSemiCircle = "translate(" + 
				((config.width / 2) - config.innerRadius - config.semiCircleWidth).toString() + 
				"," + (config.semiCircleRadius + (config.settingWidth * 2)) + ")"
			
			var diameter = config.innerRadius * 2 + config.semiCircleWidth * 2;
			var gapBetweenSettings = 2;
			
			var settingsGroup = svg
				.append("g")  
				.attr("transform", moveToLeftHandSideOfSemiCircle)
				.attr("class", "settings");
				
			settingsGroup
				.selectAll("g")
				.data(cvData.settings)
				.enter()
				.append("g")
				.attr("class", "setting");
			
			settingsGroup
				.selectAll("g.setting")
				.append("rect")
				.attr("height", (d:any) => {return config.settingWidth - gapBetweenSettings;})
				.attr("width", d => {
					var setting = settingsScaled.getForId(d.id);
					var width = (setting.end - setting.start) * diameter;
					return width;
				})
				.attr("x", (d:any) => {
					var setting = settingsScaled.getForId(d.id);
					return setting.start * diameter;
				})
				.attr("y", (d:any) => {
					var setting = settingsScaled.getForId(d.id);
					return setting.id * config.settingWidth;
				})
				.attr("fill", d => colours.getSetting(d.id, Selected.initial(), idAndActiveSorter.forInitial()));
				
			settingsGroup
				.selectAll("g.setting")
				.append("text")
				.text(d => d.name)
				.attr("y", (d:any) => (d.id + 0.5) * config.settingWidth);
			
			var minDate = LengthScaler.getMinDate(cvData.settings);
			var maxDate = LengthScaler.getMaxDate(cvData.settings);
			
			var x = d3.time.scale()
				.domain([minDate, d3.time.month.offset(maxDate, 1)])
    			.rangeRound([0, diameter]);
				
			var showTickEveryMonths = 4;
			var xAxis = d3.svg.axis()
				.scale(x)
				.orient('bottom')
				.ticks(d3.time.month, showTickEveryMonths)
				.tickFormat(d3.time.format('%m/%Y'))
				.tickSize(3)
				.tickPadding(5); 
			
			svg.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(' + config.semiCircleWidth + ', ' + (diameter / 2 + config.settingWidth) + ')')
				.call(xAxis);
			
			
			
			// Metadatas functions
			
			var textOffset = config.semiCircleWidth * 0.7;
			function inThenOutInner(d, i){
				var multiplyBy = i % 2 === 0 ? 1 : -1;
				return config.innerRadius + multiplyBy * config.semiCircleWidth - textOffset;
			}
			
			function inThenOutOuter(d, i){
				var multiplyBy = i % 2 === 0 ? 1 : -1;
				return config.innerRadius + config.semiCircleWidth + multiplyBy * config.semiCircleWidth - textOffset;
			}
			
			function radialBitsStartAngle(d:any, scaled:Scaled, radialOffset){
				var scaledValue = scaled.getForId(d.id);
				return Math.PI * scaledValue.start + radialOffset;
			}
			
			function radialBitsEndAngle(d:any, scaled:Scaled, radialOffset){
				var scaledValue = scaled.getForId(d.id);
				return Math.PI * scaledValue.end + radialOffset;
			}
			
			var halfRadialGap = 0.005;
			function slightlyShrunkRadialBitsStartAngle(d:any, scaled:Scaled, radialOffset){
				return radialBitsStartAngle(d, scaled, radialOffset) + halfRadialGap;
			}
			
			function slightlyShrunkRadialBitsEndAngle(d:any, scaled:Scaled, radialOffset){
				return radialBitsEndAngle(d, scaled, radialOffset) - halfRadialGap;
			}
			
			function twiceLongRadialEndAngle(d:any, scaled:Scaled, radialOffset){
				var end = radialBitsEndAngle(d, scaled, radialOffset)
				var start = radialBitsStartAngle(d, scaled, radialOffset)
				return (end - start) * 2 + start;
			}
			
			
			// Metadatas
			
			var metadatasScaled = lengthScaler.getMetadatas();
			
			var metadatasArc = d3.svg.arc()
				.innerRadius((d, i) => config.innerRadius)
				.outerRadius((d, i) => { return config.innerRadius + config.semiCircleWidth; })
				.startAngle((d:any) => { return slightlyShrunkRadialBitsStartAngle(d, metadatasScaled, -Math.PI / 2); })
				.endAngle((d:any) => { return slightlyShrunkRadialBitsEndAngle(d, metadatasScaled, -Math.PI / 2); });
			
			var metadatasTextArc = d3.svg.arc()
				.innerRadius((d, i) => { return inThenOutInner(d, i); })
				.outerRadius((d, i) => { return inThenOutOuter(d, i); })
				.startAngle((d:any) => { return slightlyShrunkRadialBitsStartAngle(d, metadatasScaled, -Math.PI / 2); })
				.endAngle((d:any) => { return twiceLongRadialEndAngle(d, metadatasScaled, -Math.PI / 2); }); 
			
			var metadatasGroup = svg
				.append("g")
				.attr("transform", moveToMiddle)
				.attr("class", "metadatas");
			
			metadatasGroup
				.selectAll("g")
				.data(cvData.metadatas)
				.enter()
				.append("g")
				.attr("class", "metadata");
			
			metadatasGroup
				.selectAll("g.metadata")
				.append("path")
				.attr("class", "metadata-path")
				.attr("d", <any>metadatasArc)
				.attr("fill", d => colours.getMetadata(d.id, Selected.initial(), idAndActiveSorter.forInitial()));
				
				
			metadatasGroup
				.selectAll("g.metadata")
				.append("path")
				.attr("d", <any>metadatasTextArc)
				.attr("fill", "none")
				.attr("id", d => "met" + d.id);
				
			metadatasGroup
				.selectAll("g.metadata")
				.append("text")
				.append("textPath")
				.attr("xlink:href", d => "#met" + d.id)
				.text((d:any) => d.name);
				
			// skills 
			var skillCirclesCalculator = new SkillCirclesCalculator(cvData); 
			var initialLocation = skillCirclesCalculator.forSelected(Selected.initial());
			
			var skillsGroup = svg
				.append("g")
				.attr("transform", moveToMiddle)
				.attr("class", "circles");
			
			skillsGroup
				.selectAll("g")
				.data(cvData.skills)
				.enter()
				.append("circle")
				.attr("r", (d, i) => initialLocation.forId(d.id).radius)
				.attr("cx", (d, i) => initialLocation.forId(d.id).x)
				.attr("cy", (d, i) => initialLocation.forId(d.id).y)
				.attr("fill", (d, i) => colours.getSkill(d.id, Selected.initial(), idAndActiveSorter.forInitial()))
				;
				
			
			var transitionLength = 500;
			
			function refresh(selected:Selected){
				var idAndActiveCv = idAndActiveSorter.forSelected(selected);
				var lessOpaque = 0.2 ;
				
				skillsGroup
					.selectAll("circle")
					.transition()
					.duration(transitionLength)
					.attr("fill", (d, i) => colours.getSkill(d.id, selected, idAndActiveCv))
					.attr("opacity", (d, i) => idAndActiveCv.skillActive(d.id) ? 1.0 : lessOpaque)
				
				settingsGroup
					.selectAll("rect")
					.transition()
					.duration(transitionLength)
					.attr("fill", (d, i) => colours.getSetting(d.id, selected, idAndActiveCv))
					.attr("opacity", (d, i) => idAndActiveCv.settingActive(d.id) ? 1.0 : lessOpaque)
				
				metadatasGroup
					.selectAll("path.metadata-path")
					.transition()
					.duration(transitionLength)
					.attr("fill", (d, i) => colours.getMetadata(d.id, selected, idAndActiveCv))
					.attr("opacity", (d, i) => idAndActiveCv.metadataActive(d.id) ? 1.0 : lessOpaque)
			}
			
			
			metadatasGroup
				.selectAll("path")
				.on("click", (d, i) => {
					refresh(Selected.fromMetadata(d.id));
				});
				
			skillsGroup
				.selectAll("circle")
				.on("click", (d, i) => {
					refresh(Selected.fromSkill(d.id));
				});
				
			settingsGroup
				.selectAll("rect")
				.on("click", (d, i) => {
					refresh(Selected.fromSetting(d.id))
				});
        }
	}
}