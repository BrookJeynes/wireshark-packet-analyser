import React, { useState } from "react";
import './App.css';

const App = () => {
  const [ file, setFile ] = useState({});
  const [ data, setData ] = useState({
    output: {
      tcp: [],
      http: [],
      dns: [],
      icmp: {
        request: [],
        response: []
      },
    }
  });

  const handleChange = e => {
    const fileReader = new FileReader();

    fileReader.readAsText(e.target.files[0], "UTF-8");

    fileReader.onload = e => {
      setFile(JSON.parse(e.target.result));
    };
  };

  const handleSubmit = e => {
    e.preventDefault();

    const output = {
      tcp: [],
      http: [],
      dns: [],
      icmp: {
        request: [],
        response: []
      },
    };

    const protocols = e.target.elements.data.value.split(",").map(protocol => {
      const data = protocol.toLowerCase().trim().split("_");

      return {
        protocol: data[0],
        packets: data.slice(1)
      }
    });

    protocols.forEach(data => {
      if (data.protocol === "tcp") {
        data.packets.forEach(packetIndex => {
          const packet = file[packetIndex-1]._source.layers;

          output.tcp.push({
            "id": packet.frame["frame.number"],
            "ip.src": packet.ip["ip.src"],
            "ip.dst": packet.ip["ip.dst"],
            "tcp.srcport": packet.tcp["tcp.srcport"],
            "tcp.dstport": packet.tcp["tcp.dstport"],
          }) 
        })
      } else if (data.protocol === "http") {
        data.packets.forEach(packetIndex => {
          const packet = file[packetIndex-1]._source.layers;

          output.http.push({
            "id": packet.frame["frame.number"],
            "ip.src": packet.ip["ip.src"],
            "ip.dst": packet.ip["ip.dst"],
            "url": packet.http["http.request.full_uri"]
          }) 
        })
      } else if (data.protocol === "dns") {
        data.packets.forEach(packetIndex => {
          const packet = file[packetIndex-1]._source.layers;

          output.dns.push({
            "id": packet.frame["frame.number"],
            "type": packet.dns["dns.response_to"] ? "Response" : "Query",
            "ip.src": packet.ip["ip.src"],
            "ip.dst": packet.ip["ip.dst"],
            "udp.srcport": packet.udp["udp.srcport"],
            "udp.dstport": packet.udp["udp.dstport"],
            "dns.qry.type": packet.dns["Queries"][Object.keys(packet.dns["Queries"])[0]]["dns.qry.type"],
            "dns.a": packet.dns["dns.response_to"] ? file[packet.dns["dns.response_to"]-1]._source.layers.ip["ip.dst"] : false
          }) 
        })
      } else if (data.protocol === "icmp") {
        data.packets.forEach(packetIndex => {
          const packet = file[packetIndex-1]._source.layers;

          const icmpObj = {
            "id": packet.frame["frame.number"],
            "ip.src": packet.ip["ip.src"],
            "ip.dst": packet.ip["ip.dst"],
            "icmp.type": packet.icmp["icmp.type"],
            "icmp.code": packet.icmp["icmp.code"],
          };
          
          if (packet.icmp["icmp.resp_to"]) {
            output.icmp.response.push({...icmpObj}); 
          } else {
            output.icmp.request.push({...icmpObj});
          }
        })
      }
    })

    setData({output});
  }

  return (
    <div className="App">
      <input type="file" onChange={handleChange} />

      <form onSubmit={handleSubmit}>
        <input type="text" name="data" placeholder="tcp_10_11_12, http_13_14" />       
        <input type="submit" />
      </form>

      { (data.output.tcp.length >= 3) &&
        <div>
          <table>
            <tbody>
              <tr>
                <td>IP Address of the Client</td>
                <td>{data.output.tcp[0]["ip.src"]}</td>
              </tr>
            </tbody>
            <tbody>
              <tr>
                <td>IP Address of the Server</td>
                <td>{data.output.tcp[0]["ip.dst"]}</td>
              </tr>
            </tbody>
          </table>

          <br />

          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>SYN</th>
                <th>SYN, ACK</th>
                <th>ACK</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Packet Number</td>
                <td>{data.output.tcp[0].id}</td>
                <td>{data.output.tcp[1].id}</td>
                <td>{data.output.tcp[2].id}</td>
              </tr>
              <tr>
                <td>Source IP address</td>
                <td>{data.output.tcp[0]["ip.src"]}</td>
                <td>{data.output.tcp[1]["ip.src"]}</td>
                <td>{data.output.tcp[2]["ip.src"]}</td>
              </tr>
              <tr>
                <td>Destination IP address</td>
                <td>{data.output.tcp[0]["ip.dst"]}</td>
                <td>{data.output.tcp[1]["ip.dst"]}</td>
                <td>{data.output.tcp[2]["ip.dst"]}</td>
              </tr>
              <tr>
                <td>Source port number</td>
                <td>{data.output.tcp[0]["tcp.srcport"]}</td>
                <td>{data.output.tcp[1]["tcp.srcport"]}</td>
                <td>{data.output.tcp[2]["tcp.srcport"]}</td>
              </tr>
              <tr>
                <td>Destination port number</td>
                <td>{data.output.tcp[0]["tcp.dstport"]}</td>
                <td>{data.output.tcp[1]["tcp.dstport"]}</td>
                <td>{data.output.tcp[2]["tcp.dstport"]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      }

      <br />

      { (data.output.http.length >= 2) &&
        <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>HTTP Request</th>
                <th>HTTP Response</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Packet Number</td>
                <td>{data.output.http[0].id}</td>
                <td>{data.output.http[1].id}</td>
              </tr>
              <tr>
                <td>URL entered by the user</td>
                <td colspan="2">{data.output.http[0].url}</td>
              </tr>
            </tbody>
          </table> 
        </div>
      }

      <br />

      { (data.output.dns.length >= 2) && 
        <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
          <table style={{marginRight: 25}}>
            <thead>
              <tr>
                <th colspan="2">DNS {data.output.dns[0].type}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Packet Number</td>
                <td>{data.output.dns[0].id}</td>
              </tr>
              <tr>
                <td>Source IP address</td>
                <td>{data.output.dns[0]["ip.src"]}</td>
              </tr>
              <tr>
                <td>Destination IP address</td>
                <td>{data.output.dns[0]["ip.dst"]}</td>
              </tr>
              <tr>
                <td>Source port number</td>
                <td>{data.output.dns[0]["udp.srcport"]}</td>
              </tr>
              <tr>
                <td>Destination port number</td>
                <td>{data.output.dns[0]["udp.dstport"]}</td>
              </tr>
              <tr>
                <td>Type of DNS query (DNS lookup type)</td>
                <td>{data.output.dns[0]["dns.qry.type"] == 1 && "A"}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th colspan="2">DNS {data.output.dns[1].type}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Packet Number</td>
                <td>{data.output.dns[1].id}</td>
              </tr>
              <tr>
                <td>Source IP address</td>
                <td>{data.output.dns[1]["ip.src"]}</td>
              </tr>
              <tr>
                <td>Destination IP address</td>
                <td>{data.output.dns[1]["ip.dst"]}</td>
              </tr>
              <tr>
                <td>Source port number</td>
                <td>{data.output.dns[1]["udp.srcport"]}</td>
              </tr>
              <tr>
                <td>Destination port number</td>
                <td>{data.output.dns[1]["udp.dstport"]}</td>
              </tr>
              <tr>
                <td>DNS response (the host IP address) </td>
                <td>{data.output.dns[1]["dns.a"]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      }

      <br />

      { (data.output.icmp.request.length >= 1 && data.output.icmp.response.length >= 1) &&
        <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ICMP Request</th>
                <th>ICMP Reply</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Packet Number</td>
                <td>{data.output.icmp.request.map(request => `${request.id}, `)}</td>
                <td>{data.output.icmp.response.map(request => `${request.id}, `)}</td>
              </tr>
              <tr>
                <td>Source IP address</td>
                <td>{data.output.icmp.request[0]["ip.src"]}</td>
                <td>{data.output.icmp.response[0]["ip.src"]}</td>
              </tr>
              <tr>
                <td>Destination IP address</td>
                <td>{data.output.icmp.request[0]["ip.dst"]}</td>
                <td>{data.output.icmp.response[0]["ip.dst"]}</td>
              </tr>
              <tr>
                <td>ICMP – Type</td>
                <td>{data.output.icmp.request[0]["icmp.type"]}</td>
                <td>{data.output.icmp.response[0]["icmp.type"]}</td>           
              </tr>
              <tr>
                <td>ICMP – Code</td>
                <td>{data.output.icmp.request[0]["icmp.code"]}</td>
                <td>{data.output.icmp.response[0]["icmp.code"]}</td>           
              </tr>
            </tbody>
          </table> 
        </div>
      }
    </div>
  );
}

export default App;
