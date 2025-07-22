import React, {useState, useEffect} from 'react';
import axios from "axios"
import { useNavigate } from "react-router-dom"
import BASE_URL from '../config';

export default function AddAccount() {
    const navigate = useNavigate();
    const [Account_name,setAccount_name]=useState('');
    const [Mobile_number,setMobile_number]=useState('');
    const [Account_group,setAccount_group]=useState([]);
    const [selectedGroup,setSelectedGroup]=useState('');
const institute_uuid = localStorage.getItem("institute_uuid");

 useEffect(() => {
        axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`)
            .then(res => {
                if (res.data.success) {
                    setAccount_group(res.data.result);
                }
            }).catch(err => {
                alert("Error fetching accounts");
                console.error(err);
            });
    }, []);

    async function submit(e){
        e.preventDefault();
        try{

            await axios.post(`${BASE_URL}/api/account/addAccount`,{
                Account_name,
                Mobile_number,
                Account_group: selectedGroup,
                institute_uuid: institute_uuid
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("Account already exists")
                }
                else if(res.data=="notexist"){
                    alert("Account added successfully")
                    navigate("/home")
                }
            })
            .catch(e=>{
                alert("wrong details")
                console.log(e);
            })
        }
        catch(e){
            console.log(e);
        }
    }
    return (
        <div className="flex justify-center items-center bg-secondary min-h-screen">
           
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3>Add Account</h3>
            <form onSubmit={submit}>
               
                    <label  className="block mb-2">Name</label>
                <input type="text"  onChange={(e) => { setAccount_name(e.target.value) }} placeholder="Account Name" className="form-control mb-3" />
                
                    <label className="block mb-2"><strong>Number</strong></label>
                <input type="number"  onChange={(e) => { setMobile_number(e.target.value) }} placeholder="Mobile number" className="form-control mb-3" />
               
                 <label className="block mb-2">Group</label>
                        <select
                            className="form-control mb-3"
                            onChange={e => setSelectedGroup(e.target.value)}
                            value={selectedGroup}
                            required
                        >
                            <option value="">Select Group</option>
                            {Account_group.map((g, idx) => (
                                <option key={idx} value={g.Account_group_uuid}>
                                    {g.Account_group}
                                </option>
                            ))}
                        </select>
                <button type="submit" className="w-full py-2 mb-2 bg-green-600 text-white rounded"> Submit </button>
                <button type="button" className="w-full py-2 bg-red-500 text-white rounded" onClick={() => navigate("/home")}>
                        Close
                    </button>

            </form>
        </div>
        </div>
    );
}
