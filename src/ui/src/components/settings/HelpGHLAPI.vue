<template>
  <div class="help-ghl-api">
    <iframe 
      src="https://marketplace.gohighlevel.com/docs/Authorization/authorization_doc"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'HelpGHLAPI'
}
</script>

<style scoped>
.help-ghl-api {
  width: 100%;
  height: calc(100vh - 100px);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.help-ghl-api iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
