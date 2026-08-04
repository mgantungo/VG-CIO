<!-- components/pager/ui/PagerLegend.vue -->
<template>
  <div class="pl-legend">
    <div class="pl-item"><span class="pl-swatch pl-swatch--cover"></span> Cover / Back Cover</div>
    <div class="pl-item"><span class="pl-swatch pl-swatch--section"></span> Editorial section</div>
    <div class="pl-item"><span class="pl-swatch pl-swatch--adslot"></span> One ad slot</div>
    <div class="pl-item"><span class="pl-swatch pl-swatch--multislot"></span> Multiple ad slots on this page</div>
  </div>
</template>

<style scoped>
.pl-legend {
  display: flex; gap: 18px; padding: 10px 4px; font-size: 10px; color: #555; flex-wrap: wrap;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
}
.pl-item { display: flex; align-items: center; gap: 5px; }
.pl-swatch { width: 12px; height: 12px; border: 1px solid #999; flex-shrink: 0; }
.pl-swatch--cover     { background: #003366; border-color: #003366; }
.pl-swatch--section   { background: #fff; }
.pl-swatch--adslot    { background: #EAF1FB; border-color: #0066CC; }
.pl-swatch--multislot { background: #FFF9E6; border: 2px solid #FFCC00; }
</style>