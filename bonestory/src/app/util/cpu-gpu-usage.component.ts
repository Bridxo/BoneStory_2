import { Component } from '@angular/core';
import * as si from 'systeminformation';

@Component({
  selector: 'app-cpu-gpu-usage',
  template: `
    <div>
      <p>CPU Usage: {{ cpuUsage }}%</p>
      <p>GPU Usage: {{ gpuUsage }}%</p>
    </div>
  `,
})
export class CpuGpuUsageComponent {
  cpuUsage: string;
  gpuUsage: string;

  async ngOnInit() {
    const cpuData = await si.currentLoad();
    this.cpuUsage = cpuData.currentLoad.toFixed(2);

    const gpuData = await si.graphics();
    this.gpuUsage = gpuData.controllers[0].utilizationGpu.toFixed(2);
  }
}