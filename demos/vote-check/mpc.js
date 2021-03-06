(function(exports, node) {
  var saved_instance;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    // Added options goes here
    opt.Zp = 13;

    if(node) {
      jiff = require('../../lib/jiff-client');
      $ = require('jquery-deferred');
    }

    saved_instance = jiff.make_jiff(hostname, computation_id, opt);
    // if you need any extensions, put them here

    return saved_instance;
  };

  // counts how many test_cases.
  var count = {};

  /**
   * The MPC computation
   */
  exports.compute = function (inputs, jiff_instance) {
    if(jiff_instance == null) jiff_instance = saved_instance;

    // determine which test case is this (which computation)
    if(count[jiff_instance.id] == null) count[jiff_instance.id] = 1;
    var this_count = count[jiff_instance.id];
    count[jiff_instance.id]++;

    // final answer.
    var deferred = $.Deferred();

    // This array holds the shares for each option in the voting
    jiff_instance.share_array(inputs).then(function(option_shares) {
      var results = option_shares[1].slice();

      // Get a partial tally for each option in the vote by adding the shares across parties together.
      for(var j = 2; j <= jiff_instance.party_count; j++) {
        for(var i = 0; i < option_shares[j].length; i++)
          results[i] = results[i].sadd(option_shares[j][i]);
      }

      // Do Checks:
      // Check 1
      // each single vote option must be less than or equal to 1
      var check = option_shares[1][0].clteq(1, "t"+this_count+":clteq_check:--");
      for(var j = 1; j <= jiff_instance.party_count; j++) {
        for(var i = 0; i < option_shares[j].length; i++)
          check = check.smult(option_shares[j][i].clteq(1, "t"+this_count+":clteq_check:"+i+":"+j), "t"+this_count+":smult_check:"+i+":"+j);
      }
      
      // Check 2
      // Each party gets one vote only: sum of all votes of one party should be less than or equal to 1
      for(var j = 1; j <= jiff_instance.party_count; j++) {
        var sum = option_shares[j][0];
        for(var i = 1; i < option_shares[j].length; i++)
          sum = sum.sadd(option_shares[j][i]);
        check = check.smult(sum.clteq(1, "t"+this_count+":clteq_check2:"+j), "t"+this_count+":smult_check2:"+j);
      }
      
      // Apply Checks:
      // if some check fails, set all votes to 0
      for(var i = 0; i < results.length; i++) {
        results[i] = results[i].smult(check, "t"+this_count+":smult_apply:"+i+":"+j);
      }

      // Open
      jiff_instance.open_array(results, null, "t"+this_count+":open").then(function(results) {
        deferred.resolve(results);
      });
    });

    return deferred.promise();
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));
