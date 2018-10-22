const CBOR = require('./cbor');
const zlib = require('zlib');

var sensorMsgsImage = {
  header: {
    stamp: {
      sec: 1,
      nanosec: 1e8
    },
    frame_id: "map"
  },
  height: 480,
  width: 640,
  encoding: "RGB",
  is_bigendian: 0,
  step: 640,
  data: Uint8Array.from(Array.from({length: 640 * 480 * 3}, () => Math.floor(Math.random() * 256)))
};

var sensorMsgsPointCloud2 = {
  header: {
    stamp: {
      sec: 1,
      nanosec: 1e8
    },
    frame_id: "map"
  },
  height: 1,
  width: 1928,
  fields: [
    { name: "x", offset: 0, datatype: 7, count: 1 },
    { name: "y", offset: 4, datatype: 7, count: 1 },
    { name: "z", offset: 8, datatype: 7, count: 1 },
    { name: "intensity", offset: 16, datatype: 7, count: 1 },
    { name: "ring", offset: 20, datatype: 7, count: 1 }
  ],
  is_bigendian: false,
  point_step: 32,
  row_step: 61696,
  data: Uint8Array.from(Array.from({length: 1 * 1928 * 32}, () => Math.floor(Math.random() * 256))),
  is_dense: true
};

var geometryMsgsTransformStamped = {
  header: {
    stamp: {
      sec: 1,
      nanosec: 1e8
    },
    frame_id: "map"
  },
  child_frame_id: "robot",
  transform: {
    translation: { x: 1.23, y: 1.23, z: 1.23 },
    rotation: { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }
  }
};

/* simulate the msg data being packed in a rosbridge protocol message */
function payload(msg) {
  return JSON.stringify({
    op: "publish",
    topic: "/foo",
    msg: msg
  });
}

function base64ToArrayBuffer(base64) {
  var buf = Buffer.from(base64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function arrayBufferToBase64(buf) {
  return Buffer.from(buf).toString("base64");
}

/* from object to object, a comparison of CBOR+base64 and JSON encoding */
function runBenchmark(name, benchmarkData) {
  console.log(name);

  // encode object to CBOR byte array
  console.time("CBOR encode");
  var x = CBOR.encode(benchmarkData);
  console.timeEnd("CBOR encode");

  // payload as base64
  console.time("CBOR payload");
  var xp = payload(arrayBufferToBase64(x));
  console.timeEnd("CBOR payload");

  // payload object as JSON
  console.time("JSON payload");
  var zp = payload(benchmarkData);
  console.timeEnd("JSON payload");

  // size over the wire
  console.log("CBOR payd:", xp.length, "bytes");
  console.log("JSON payd:", zp.length, "bytes");

  // depayload from base64
  console.time("CBOR depay");
  var xd = base64ToArrayBuffer(JSON.parse(xp).msg);
  console.timeEnd("CBOR depay");

  // decode CBOR byte array to object
  console.time("CBOR decode");
  var x1 = CBOR.decode(xd);
  console.timeEnd("CBOR decode");

  // depayload object from JSON
  console.time("JSON depay");
  var z1 = JSON.parse(zp).msg;
  console.timeEnd("JSON depay");
}

runBenchmark("sensor_msgs/Image", sensorMsgsImage);
runBenchmark("sensor_msgs/PointCloud2", sensorMsgsPointCloud2);
runBenchmark("geometry_msgs/PoseStamped", geometryMsgsTransformStamped);
