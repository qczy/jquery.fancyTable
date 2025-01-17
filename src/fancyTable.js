/*!
 * jQuery fancyTable plugin
 * https://github.com/myspace-nu
 *
 * Copyright 2018 Johan Johansson
 * Released under the MIT license
 * q3 v 1.1
 */
(function($) {
	$.fn.fancyTable = function(options) {
		var settings = $.extend({
			inputStyle: "",
			inputPlaceholder: "Search...",
			pagination: false,
			paginationElement: "",
			paginationClass: "btn btn-light",
			paginationClassActive: "active",
			pagClosest: 3, /* 1...123X321...n */
			spacer: "...",
			spacerClass: "",
			showArrows: false,
			prevArrow: "&#10094",
			nextArrow: "&#10095",
			perPage: 10,
			sortable: true,
			searchable: true,
			matchCase: false,
			exactMatch: false,
			onInit: function(){ },
			onUpdate: function(){ },
			sortFunction: function(a, b, o){
				if(o.sortAs[o.sortColumn] == 'numeric'){
					return((o.sortOrder>0) ? parseFloat(a)-parseFloat(b) : parseFloat(b)-parseFloat(a));
				} else {
					return((a<b)?-o.sortOrder:(a>b)?o.sortOrder:0);
				}
			},
			testing: false
		}, options);
		var instance = this;
		this.settings = settings;
		this.tableUpdate = function (elm) {
			elm.fancyTable.matches = 0;
			$(elm).find("tbody tr").each(function() {
				var n=0;
				var match = true;
				var globalMatch = false;
				$(this).find("td").each(function() {
					if(!settings.globalSearch && elm.fancyTable.searchArr[n] && !(instance.isSearchMatch($(this).html(),elm.fancyTable.searchArr[n]) )){
						match = false;
					} else if(settings.globalSearch && (!elm.fancyTable.search || (instance.isSearchMatch($(this).html(),elm.fancyTable.search) ))){
						if(!Array.isArray(settings.globalSearchExcludeColumns) || !settings.globalSearchExcludeColumns.includes(n+1)){
							globalMatch = true;
						}
					}
					n++;
				});
				if((settings.globalSearch && globalMatch) || (!settings.globalSearch && match)){
					elm.fancyTable.matches++
					if(!settings.pagination || (elm.fancyTable.matches>(elm.fancyTable.perPage*(elm.fancyTable.page-1)) && elm.fancyTable.matches<=(elm.fancyTable.perPage*elm.fancyTable.page))){
						$(this).show();
					} else {
						$(this).hide();
					}
				} else {
					$(this).hide();
				}
			});
			elm.fancyTable.pages = Math.ceil(elm.fancyTable.matches/elm.fancyTable.perPage);
			if(settings.pagination){
				var paginationElement = (settings.paginationElement) ? $(elm).next(".pag") : $(elm).find(".pag");
				paginationElement.empty();
				
				if(settings.showArrows){
					var a = $("<a>",{
							html:settings.prevArrow,
							class:settings.paginationClass+" "+((1==elm.fancyTable.page)?"w3-disabled":"")
						});
					if(1!=elm.fancyTable.page)
						a.bind("click",function(){
							elm.fancyTable.page--;
							instance.tableUpdate(elm);
						});
					paginationElement.append(a);
				}
				
				for(var n=1; n<=elm.fancyTable.pages; n++){
					if(n==1 || (n>(elm.fancyTable.page-(settings.pagClosest+1)) && n<(elm.fancyTable.page+(settings.pagClosest+1))) || n==elm.fancyTable.pages){
						var a = $("<a>",{
							href: "#"+n,
							html:n,
							"data-n": n,
							class:settings.paginationClass+" "+((n==elm.fancyTable.page)?settings.paginationClassActive:"")
						}).bind("click",function(e){
							e.preventDefault();
							elm.fancyTable.page = $(this).data("n");
							instance.tableUpdate(elm);
						});
						if(n==elm.fancyTable.pages && elm.fancyTable.page<(elm.fancyTable.pages-settings.pagClosest-1)){
							paginationElement.append($("<span>",{
								html:settings.spacer,
								class:settings.spacerClass
							}));
						}
						paginationElement.append(a);
						if(n==1 && elm.fancyTable.page>settings.pagClosest+2){
							paginationElement.append($("<span>",{
								html:settings.spacer,
								class:settings.spacerClass
							}));
						}
					}
				}
				if(settings.showArrows){
					var a = $("<a>",{
							html:settings.nextArrow,
							class:settings.paginationClass+" "+((elm.fancyTable.pages==elm.fancyTable.page)?"w3-disabled":"")
						});
					if(elm.fancyTable.pages!=elm.fancyTable.page)
						a.bind("click",function(){
							elm.fancyTable.page++;
							instance.tableUpdate(elm);
						});
					paginationElement.append(a);
				}
			}
			settings.onUpdate.call(this,elm);
		};
		this.isSearchMatch = function(data, search){
			if(!settings.matchCase){ data=data.toUpperCase(); search = search.toUpperCase(); }
			if(settings.exactMatch == "auto" && search.match(/^".*?"$/)){
				// Exact match due to "quoted" value
				search = search.substring(1,search.length-1);
				return (data==search);
			} else if(settings.exactMatch == "auto" && search.replace(/\s+/g,"").match(/^[<>]/)){
				// Less < or greater > than
				var comp = search.replace(/\s+/g,"").substring(0,1);
				var val = search.replace(/\s+/g,"").substring(1);
				return ((comp == '>' && data*1 > val*1) || (comp == '<' && data*1 < val*1))
			} else if(settings.exactMatch == "auto" && search.replace(/\s+/g,"").match(/^.+(\.\.|-).+$/)){
				// Intervall 10..20 or 10-20
				var arr = search.replace(/\s+/g,"").split(/\.\.|-/);
				return (data*1 > arr[0]*1 && data*1 < arr[1]*1);
			}
			return (settings.exactMatch === true) ? (data==search) : (new RegExp(search).test(data));
		};
		this.reinit = function(){
			$(this).each(function(){
				$(this).find("th a").contents().unwrap();
				$(this).find("tr.fancySearchRow").remove();
			});
			$(this).fancyTable(this.settings);
		};
		this.tableSort = function (elm) {
			if(typeof elm.fancyTable.sortColumn !== "undefined" && elm.fancyTable.sortColumn < elm.fancyTable.nColumns){
				var iElm = 0;
				$(elm).find("thead th").each(function(){
					$(this).attr("aria-sort",
						(iElm == elm.fancyTable.sortColumn) ? 
							( (elm.fancyTable.sortOrder == 1) ? "ascending" : (elm.fancyTable.sortOrder == -1) ? "descending" : "other" )
							: null // "none" // Remove the attribute instead of setting to "none" to avoid spamming screen readers.
					);
					iElm++;
				});
				$(elm).find("thead th div.sortArrow").each(function(){
					$(this).remove();
				});
				var sortArrow = $("<div>",{"class":"sortArrow"}).css({"margin":"0.1em","display":"inline-block","width":0,"height":0,"border-left":"0.4em solid transparent","border-right":"0.4em solid transparent"});
				sortArrow.css(
					(elm.fancyTable.sortOrder>0) ?
					{"border-top":"0.4em solid #ffff"} :
					{"border-bottom":"0.4em solid #ffff"}
				);
				$(elm).find("thead th a").eq(elm.fancyTable.sortColumn).append(sortArrow);
				
				elm.fancyTable.page = 1;
				instance.tableUpdate(elm);
				
				var rows = $(elm).find("tbody tr").toArray().sort(
					function(a, b) {
						var elma = $(a).find("td").eq(elm.fancyTable.sortColumn);
						var elmb = $(b).find("td").eq(elm.fancyTable.sortColumn);
						var cmpa = $(elma).data("sortvalue") ? $(elma).data("sortvalue") : elma.html();
						var cmpb = $(elmb).data("sortvalue") ? $(elmb).data("sortvalue") : elmb.html();
						if(elm.fancyTable.sortAs[elm.fancyTable.sortColumn] == 'case-insensitive') {
							cmpa = cmpa.toLowerCase();
							cmpb = cmpb.toLowerCase();
						}
						return settings.sortFunction.call(this,cmpa,cmpb,elm.fancyTable);
					}
				);
				$(elm).find("tbody").empty().append(rows);
			}
		};
		this.each(function() {
			if($(this).prop("tagName")!=="TABLE"){
				console.warn("fancyTable: Element is not a table.");
				return true;
			}
			var elm = this;
			elm.fancyTable = {
				nColumns: $(elm).find("td").first().parent().find("td").length,
				nRows : $(this).find("tbody tr").length,
				perPage : settings.perPage,
				page : 1,
				pages : 0,
				matches : 0,
				searchArr : [],
				search : "",
				sortColumn : settings.sortColumn,
				sortOrder : (typeof settings.sortOrder === "undefined") ? 1 : (new RegExp("desc","i").test(settings.sortOrder) || settings.sortOrder == -1) ? -1 : 1,
				sortAs:[] // null, numeric or case-insensitive
			};
			if($(elm).find("tbody").length==0){
				var content = $(elm).html();
				$(elm).empty();
				$(elm).append("<tbody>").append($(content));
			}
			if($(elm).find("thead").length==0){
				$(elm).prepend($("<thead>"));
				// Maybe add generated headers at some point
				//var c=$(elm).find("tr").first().find("td").length;
				//for(var n=0; n<c; n++){
				//	$(elm).find("thead").append($("<th></th>"));
				//}
			}
			if(settings.sortable){
				var nAElm=0;
				$(elm).find("thead th").each(function() {
					elm.fancyTable.sortAs.push(
						($(this).data('sortas')=='numeric') ? 'numeric' :
						($(this).data('sortas')=='case-insensitive') ? 'case-insensitive' :
						null
					);
					var content = $(this).html();
					var a = $("<a>",{
						href: "#",
						"aria-label": "Sort by " + $(this).text(),
						html:content,
						"data-n": nAElm,
						class:""
					}).css({"cursor":"pointer","color":"inherit","text-decoration":"none"}).bind("click",function(){
						if(elm.fancyTable.sortColumn == $(this).data("n")){
							elm.fancyTable.sortOrder=-elm.fancyTable.sortOrder;
						} else {
							elm.fancyTable.sortOrder=1;
						}
						elm.fancyTable.sortColumn = $(this).data("n");
						instance.tableSort(elm);
						instance.tableUpdate(elm);
						return false;
					});
					$(this).empty();
					$(this).append(a);
					nAElm++;
				});
			}
			if(settings.searchable){
				var searchHeader = $("<tr>").addClass("fancySearchRow");
				if(settings.globalSearch){
					var searchField = $("<input>",{
						"aria-label": "Search table",
						"placeholder": settings.inputPlaceholder,
						style:"width:100%;box-sizing:border-box;"+settings.inputStyle
					}).bind("change paste keyup",function(){
						elm.fancyTable.search = $(this).val();
						elm.fancyTable.page = 1;
						instance.tableUpdate(elm);
					});
					var th = $("<th>",{ style:"padding:2px;" }).attr("colspan",elm.fancyTable.nColumns);
					$(searchField).appendTo($(th));
					$(th).appendTo($(searchHeader));
				} else {
					var nInputElm=0;
					$(elm).find("td").first().parent().find("td").each(function() {
						elm.fancyTable.searchArr.push("");
						var searchField = $("<input>",{
							"aria-label": "Search column",
							"data-n": nInputElm,
							"placeholder": settings.inputPlaceholder,
							style:"width:100%;box-sizing:border-box;"+settings.inputStyle
						}).bind("change paste keyup",function(){
							elm.fancyTable.searchArr[$(this).data("n")] = $(this).val();
							elm.fancyTable.page = 1;
							instance.tableUpdate(elm);
						});
						var th = $("<th>",{ style:"padding:2px;" });
						$(searchField).appendTo($(th));
						$(th).appendTo($(searchHeader));
						nInputElm++;
					});
				}
				searchHeader.appendTo($(elm).find("thead"));
			}
			// Sort
			instance.tableSort(elm);
			if(settings.pagination){
				if(!settings.paginationElement){
					$(elm).find("tfoot").remove();
					$(elm).append($("<tfoot><tr></tr></tfoot>"));
					$(elm).find("tfoot tr").append($("<td class='pag'></td>",{ }).attr("colspan",elm.fancyTable.nColumns));
				}else
				{
					$(elm).after($(settings.paginationElement).addClass("pag"));	
				}
			}
			instance.tableUpdate(elm);
			settings.onInit.call(this,elm);
		});
		return this;
	};
}(jQuery));	
