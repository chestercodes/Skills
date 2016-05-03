﻿/// <reference path='_references.ts' />

module App
{
	export class SkillCirclesCalculator
	{
		constructor(public cvData: CV.ICVData){ }
		
		public forSelected = (selected:Selected) => {
			// todo, why do i have to do this in ts?
			var that = this;
			
			var distanceBetweenCircles = 10;
			var circleRadius = 4;
			return new SkillCircles(
				this.cvData.skills.map(s => {
					var sqRootModulus = Math.ceil(Math.sqrt(that.cvData.skills.length)); 
					var sqrtMod = s.id % sqRootModulus;
					var x = sqrtMod * distanceBetweenCircles;
					var propOfTotal = s.id / sqRootModulus;
					var y = Math.floor(propOfTotal) * distanceBetweenCircles;
					return new SkillCircle(s.id, -x, -y, circleRadius);
				})
			);
		}
	}
	export class SkillCircles
	{
		constructor(public circles:SkillCircle[]){ }
		
		forId(id:number):SkillCircle{
			return this.circles.filter(c => c.id === id)[0];
		}
	}
	export class SkillCircle {
		constructor(
			public id:number,
			public x:number, 
			public y:number, 
			public radius:number) {
			
		}
	}

}