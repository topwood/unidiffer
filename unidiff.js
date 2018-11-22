'use strict'

import * as jdiff from 'diff';
import * as hunk from './hunk';

// return a change type code for the change (returned from diff.diffLines())
function changeType(change) {
    if(change.added) {
        return hunk.ADDED
    } else if(change.removed) {
        return hunk.REMOVED
    } else {
        return hunk.UNMODIFIED
    }
}

// Given changes from a call to diff.diffLines(), assign each change a type code and
// check that no two of same type occur in a row
function checkAndAssignTypes(changes) {
    if(changes.length === 0) { return [] }

    changes[0].type = changeType(changes[0])
    return changes.reduce(function(a, b, i) {
        b.type = changeType(b)
        if(a.type === b.type) {
            throw Error('repeating change types are not handled: ' + a.type  + ' (at ' + (i-1) + ' and ' + i + ')')
        }
        return b
    })
}


// convert an array of results from diff.diffLines() into text in unified diff format.
// return empty string if there are no changes.
export function formatLines(changes, opt) {
    checkAndAssignTypes(changes)
    opt = opt || {}
    opt.aname = opt.aname || 'a'
    opt.bname = opt.bname || 'b'
    var context = (opt.context || opt.context === 0) ? opt.context : 0
    opt.pre_context = (opt.pre_context || opt.pre_context === 0) ? opt.pre_context : context
    opt.post_context = (opt.post_context || opt.post_context === 0) ? opt.post_context : context

    var hunks = hunk.makeHunks(changes, opt.pre_context, opt.post_context)
    if(hunks.length) {
        var ret = []
        ret.push('--- ' + opt.aname)
        ret.push('+++ ' + opt.bname)
        hunks.forEach(function(h) {
            ret.push(h.unified())
        })
        return ret.join('\n')
    } else {
        return ''
    }
}

// same as jsdiff.diffLines, but returns empty array when there are no changes (instead of an array with a single
// unmodified change object)
export function diffLines(a, b, cb) {
    a = Array.isArray(a) ? a.join('\n') + '\n' : a
    b = Array.isArray(b) ? b.join('\n') + '\n' : b
    var ret = jdiff.diffLines(a, b, cb)
    if(ret.length === 1 && !ret[0].added && !ret[0].removed) {
        return []
    } else {
        return ret
    }
}

export function diffAsText(a, b, opt) {
    return formatLines(diffLines(a, b), opt)
}

// handy assertion function that asserts that two arrays or two multi-line strings are the same and reports
// differences to console.log in unified format if there are differences.
//
//     actual - array or multi-line string to compare
//     expected - array or multi-line string to compare
//     label - label to clarify output if there are differences
//     okFn - function like tape.ok that takes two arguments:
//         expression - true if OK, false if failed test
//         msg - a one-line message that prints upon failure
//     logFn - function to call with diff output when there are differences (defaults to console.log)
//
export function assertEqual(actual, expected, okFn, label, logFn) {
    logFn = logFn || console.log
    okFn = okFn.ok || okFn
    var diff = diffAsText(actual, expected, {context: 3, aname: label + " (actual)", bname: label + ' (expected)'})
    okFn(!diff, label)
    if(diff) {
        diff.split('\n').forEach(function(line) {
            logFn('  ' + line)
        })
    }
}
