import { Navigate } from 'react-router-dom';
import HomePage from '../pages/Home';
export function HomeGate(){return localStorage.getItem('studyflow.onboarded')==='1'?<HomePage/>:<Navigate to="/onboarding" replace/>;}
