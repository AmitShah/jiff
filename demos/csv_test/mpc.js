(function(exports, node) {
  var saved_instance;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);

    if(node)
      jiff = require('../../lib/jiff-client');

    saved_instance = jiff.make_jiff(hostname, computation_id, opt);
    return saved_instance;
  };

  /**
   * The MPC computation
   */
  exports.compute = function (input, jiff_instance) {
    if(jiff_instance == null) jiff_instance = saved_instance;

    var fs = require('fs');

    var inputData = [];
    var unparsedData = fs.readFileSync(input, 'UTF-8');
    var rows = unparsedData.split('\n');

    for (var i = 1; i < rows.length; i++)
    {
      inputData.push(rows[i].map(Number));
    }

    var shares = [];

    for (var j = 0; j < inputData.length; j++)
    {
      shares.push()
    }


    // The MPC implementation should go *HERE*
    var shares = jiff_instance.share(input);
    var sum = shares[1];
    for(var i = 2; i <= jiff_instance.party_count; i++) {
      sum = sum.sadd(shares[i]);
    }

    // Return a promise to the final output(s)
    return jiff_instance.open(sum);
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));
