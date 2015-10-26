//Simon Komlos (s.komlos@gmail.com). Created for Ai's coding challenge. (10/24/15)
//I might have gone a bit overboard on the commenting... sorry!
var cut_width = 0.125, default_length = 96;
var lumber = [];
//function to quickly create an associative array.
var add_lumber = function(length, quantity) {
    lumber.push({ len: cut_width + +length, quantity: quantity });
};
//variable to create the new input area. (used for the "Add Cut" button)
var input_area = '\
		<tr>\
			<td><input class="length" type="text" maxlength="6"/></td>\
			<td><span class="times">X</span></td>\
			<td><input class="quantity" type="text" maxlength="6"/></td>\
			<td><button class="btn btn-danger remove">Remove</button></td>\
		</tr>';
//function to create quick alert messages to the user. (used for form validation)
var create_alert = function(type, message) {
    var alert_message = '\
			<br><div class="alert alert-'+type+' alert-dismissible" role="alert">\
			  <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
			  <strong>Oops!</strong> '+message+'.\
			</div>';
	return alert_message;
};
//start of the recursive solution.
//This loop will run through each lumber length / quantity combination, 
//and find the most efficient size for the remainder of the lumber after cutting those lengths off.
function optimized_cuts(lumber, default_length) {
    var lumber_optimized;
    if (lumber.length == 1) {
        var quantity = Math.min(Math.floor(default_length / lumber[0].len), lumber[0].quantity);
        lumber_optimized = {"cuts": [{"len": lumber[0].len, "quantity": quantity}], "scrap": default_length - quantity * lumber[0].len};
    } else {
        for (var p = 0; p <= lumber[0].quantity; p++) {
            var cut = optimized_cuts(lumber.slice(1), default_length - lumber[0].len * p);
            if (default_length > lumber[0].len * p) {
                if (!lumber_optimized || cut.scrap < lumber_optimized.scrap) {
                    cut.cuts.push({ "len": lumber[0].len, "quantity": p });
                    lumber_optimized = cut;
                }
            }
        }
    }
    return lumber_optimized;
}
//This is a function to remove the lengths that have been cut off from the stock.
//This just assigns the leftovers array to contain the lumber lengths 
//that will still have a quantity remaining on them after the cuts have been subtracted.
function remove_cuts(lumber, cuts) {
    var leftovers = [];
    for (var p in lumber) {
        for (var c in cuts) {
            if (cuts[c].len === lumber[p].len) {
                var remainder = lumber[p].quantity - cuts[c].quantity;
                if (remainder) {
                    leftovers.push({"len": lumber[p].len, "quantity": remainder});
                }
            }
        }
    }
    return leftovers;
}

//UI&UX part, as well as output.

//force the textbox to be highlighted on load.
$(".length").focus();

//Event handler for when the user wants to create new cuts.
$(".lumber_calc tfoot tr").on( "click", "#add_cut", function() {
    $("#input_area").append(input_area);
    //allow the user to remove fields.
	$(".lumber_calc tbody tr").on( "click", "button.remove", function() {
		$(this).parents("tr").remove();
	});
});

//Build the output when the user presses Calculate.
$(".lumber_calc tfoot tr").on( "click", "button#calculate", function() {
	var output = document.getElementById("scrap");
	output.innerHTML = "";
//A few cases that will prevent the user from inputting an invalid item.
	//Form validation for when the user doesn't input anything.
	if($(".length").val().length <= 0 || $(".quantity").val().length <= 0 || $(".quantity").val() <= 0 || $(".length").val() <= 0 ) {
		$(".warning").html(create_alert("danger", "Please make sure the fields aren\'t empty"));
		$(".results").hide();
	//Form validation for when the user exceeds the default length.
	} else if ($(".length").val() > default_length) {
		$(".warning").html(create_alert("warning", "Please make sure the length is smaller than "+default_length));
		$(".results").hide();
	//Form validation for when the user enters the default length.
	}  else if ($(".length").val() == default_length) {
		$(".warning").html(create_alert("success", "You don\'t have to cut this item... It\'s already at length"));
		$(".results").hide();
	//Form validation for when the user doesn't input a number.
	 } else if ($.isNumeric($(".length").val()) == false || $.isNumeric($(".quantity").val()) == false){
	 	$(".warning").html(create_alert("danger", "Please only input numbers"));
		$(".results").hide();
	//If the user passes the form validation steps, now we can output the result they are expecting.
	 } else {
		lumber = [], lumber_computed = [], scrap;
		//Store the input field values in an associative array.
		$("#input_area tr").each(function() {
			add_lumber($(this).children('td').children('.length').val(), $(this).children('td').children('.quantity').val())
		});

		//In this while loop we know that we  still have lumber remaining, 
		//so we are going to find the optimized cuts, and remove them from the lumber required.
		var lumber_used = [];
		while (lumber.length) {
		    var lumber_optimizeds = optimized_cuts(lumber, default_length);
		    lumber = remove_cuts(lumber, lumber_optimizeds.cuts);
		    lumber_used.push(lumber_optimizeds);
		}

		//Start of our outputting process.
		var scrap_sum = 0;
		var stick_numb = 1;
		$(".results").show();
		$(".alert").remove();
		//loop through the lumber used and output the information.
		for (var i in lumber_used) {
			var stick_numb = +i+1;
			//Setting the quantity of the sticks that will be required to complete the job.
		    output.innerHTML += "<span class='stick'>Stick " + (stick_numb) + ":</span> ";
		    //loop through the cuts created from the lumber used.
		    for (var c in lumber_used[i].cuts) {
		    	//remove the cut_width from the length of the cuts to get a more accurate reading of
		    	//cut length required.
		    	var accurate_cut = +lumber_used[i].cuts[c].len - cut_width;
		    	//one last check to make sure that the quantity of the cuts required are
		    	//greater than 0.
		    	if(!lumber_used[i].cuts[c].quantity <= 0) {
		    		//if we are all clear, output the required cuts.
		        	output.innerHTML += "<b>" + lumber_used[i].cuts[c].quantity + "</b> x " + accurate_cut + "\", ";
		    	}
		    }
		    output.innerHTML += "\n";
		    //output the scrap created from each [i] of lumber used
		    output.innerHTML += "<b>Scrap:</b> " + lumber_used[i].scrap + "\"<br><br>";
		    //generate the total scrap created
		    scrap_sum += lumber_used[i].scrap;
		}
			//output total scrap.
			output.innerHTML += "<br><b>Total Scrap: " + scrap_sum + "\"</b><br>";
	}
});