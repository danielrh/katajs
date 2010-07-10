/*  KataJS
 *  Space.js
 *
 *  Copyright (c) 2010, Ewen Cheslack-Postava
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of Sirikata nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

Kata.include("katajs/oh/SpaceConnection.js");
Kata.include("katajs/core/Math.uuid.js");
Kata.include("katajs/space/loop/Loc.js");
Kata.include("katajs/space/loop/EveryoneProx.js");

(function() {

     /** A simple loopback space.  To simulate a network, the loopback
      * space delays all calls with a timeout.
      *
      * @constructor
      * @param {Kata.URL} spaceurl the URL of this space
      */
     Kata.LoopbackSpace = function(spaceurl) {
         // First try to add to central registery
         if (Kata.LoopbackSpace.spaces[spaceurl.host])
             Kata.warn("Overwriting static LoopbackSpace map entry for " + spaceurl);
         Kata.LoopbackSpace.spaces[spaceurl.host] = this;

         this.netdelay = 10; // Constant delay, in milliseconds

         this.mObjects = {};
         this.mLoc = new Kata.Loopback.Loc();
         this.mProx = new Kata.Loopback.EveryoneProx(this);
     };

     /** Static map of local spaces, used to allow
      *  LoopbackSpaceConnection to discover these spaces.
      *  See LoopbackSpaceConnection.js for details on this use.
      */
     Kata.LoopbackSpace.spaces = {};

     /** Request an object to be connected. cb is an object whose
      * fields are callbacks for particular events: connect, prox,
      * etc.
      */
     Kata.LoopbackSpace.prototype.connectObject = function(id, cb) {
         var spaceself = this;
         setTimeout(
             function() {
                 spaceself._connectObject(id, cb);
             },
             this.netdelay
         );
     };
     Kata.LoopbackSpace.prototype._connectObject = function(id, cb) {
         var uuid = Math.uuid();
         var obj =
             {
                 uuid : uuid
             };

         var obj_loc = {
             pos : [0, 0, 0],
             vel : [0, 0, 0],
             acc : [0, 0, 0]
         };
         var obj_bounds = {
             min : [0, 0, 0],
             max : [0, 0, 0]
         };

         this.mLoc.add(uuid, obj_loc.pos, obj_loc.vel, obj_loc.acc, obj_loc.bounds);
         this.mProx.addObject(uuid);

         this.mObjects[uuid] = cb;
         cb.connected(id, uuid, obj_loc, obj_bounds); // FIXME clone these so they aren't shared
     };

     Kata.LoopbackSpace.prototype.registerProxQuery = function(id, sa) {
         var spaceself = this;
         setTimeout(
             function() {
                 spaceself._registerProxQuery(id, sa);
             },
             this.netdelay
         );
     };
     Kata.LoopbackSpace.prototype._registerProxQuery = function(id, sa) {
         this.mProx.addQuery(id);
     };

     Kata.LoopbackSpace.prototype.proxResult = function(querier, observed, entered) {
         var querier_cb = this.mObjects[querier];
         if (!querier_cb) {
             Kata.warn("LoopbackSpace got query result for non-existant object: " + querier);
             return;
         }

         querier_cb.prox(observed, entered);
     };
})();