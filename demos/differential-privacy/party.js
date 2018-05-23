
      var jiff_instance;

      function connect() {
        $('#connectButton').prop('disabled', true);
        var computation_id = $('#computation_id').val();
        var party_count = parseInt($('#count').val());

        if(isNaN(party_count)) {
          $("#output").append("<p class='error'>Party count must be a valid number!</p>");
          $('#connectButton').prop('disabled', false);
        } else {
          var options = { party_count: party_count};
          options.onError = function(error) { $("#output").append("<p class='error'>"+error+"</p>"); };
          options.onConnect = function() { $("#output").append("<p>All parties Connected!</p>"); $("#voteButton").attr("disabled", false); };

          var hostname = window.location.hostname.trim();
          var port = window.location.port;
          if(port == null || port == '') 
            port = "80";
          if(!(hostname.startsWith("http://") || hostname.startsWith("https://")))
            hostname = "http://" + hostname;
          if(hostname.endsWith("/"))
            hostname = hostname.substring(0, hostname.length-1);
          if(hostname.indexOf(":") > -1)
            hostanme = hostname.substring(0, hostname.indexOf(":"));
  
          hostname = hostname + ":" + port;
          jiff_instance = jiff.make_jiff(hostname, computation_id, options);
        }
      }



      function vote() {

        let vote = 0;
        if (document.getElementById('hillary').checked) {
          vote++;
        }

        const noise = generateNoise();

        MPC([vote, noise]);
        
    
      }

      function generateNoise() {
        const variance = 1 / (Math.sqrt(jiff_instance.party_count));

        const distribution = gaussian(jiff_instance.party_count, variance);

        return distribution.ppf(Math.random());

      }

      function applyNoise(shares) {

      }

      function sumShares(shares) {
        var sum = shares["1"];
        console.log(sum)

        for (var i = 2; i <= Object.keys(shares).length; i++) {
          sum = sum.add(shares[i])
        }   
        
        return sum;
      }

      function MPC(inputs) {
        $("#sumButton").attr("disabled", true);
        $("#output").append("<p>Starting...</p>");

        const votes = jiff_instance.share(inputs[0]);

        voteSum = sumShares(votes);

        jiff_instance.open(voteSum).then(function(values) {
          console.log(values);
        });
      }

      function handleResult(results) {

        console.log('results',results)
        // for(var i = 0; i < results.length; i++) {
        //   if(results[i] == null) continue;
        //   $("#res"+i).html(results[i]);
        // }

        // $("#sumButton").attr("disabled", false);
      }

      function handleError() {
        console.log("Error in open_all");
      }